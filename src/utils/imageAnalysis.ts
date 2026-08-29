
import { supabase } from '@/integrations/supabase/client';
import { useScanStore } from '@/store/scanStore';
import type { StyleAnalysisResult } from '@/types/styleTypes';
import { parseAnalysis } from '@/utils/analysisParser';
import { Logger } from '@/utils/logger';
import { validateImageFile } from '@/utils/validation';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

const uploadImageToSupabase = async (imageFile: File): Promise<string> => {
  try {
    const validation = validateImageFile(imageFile);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    const timestamp = new Date().getTime();
    const filePath = `outfit_${timestamp}_${imageFile.name.replace(/\s+/g, '_')}`;
    
    Logger.debug('Attempting to upload image:', filePath);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to upload images');
    }
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('style_images')
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) {
      Logger.error('Error uploading image:', uploadError);
      throw new Error('Failed to upload image to storage: ' + uploadError.message);
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('style_images')
      .getPublicUrl(filePath);
      
    Logger.info('Image upload successful');
    return publicUrl;
  } catch (error) {
    Logger.error('Image upload error:', error);
    throw error;
  }
};

export const analyzeStyle = async (imageFile: File, isOnboarding = false): Promise<StyleAnalysisResult> => {
  try {
    // Validate image file
    const validation = validateImageFile(imageFile);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    const base64Image = await fileToBase64(imageFile);
    
    Logger.info(`Starting style analysis... (Onboarding: ${isOnboarding})`);
    const startTime = performance.now();
    
    // Call the edge function for real AI analysis
    const { data, error } = await supabase.functions.invoke('analyze-style', {
      body: { image: base64Image, style: "casual" }
    });

    if (error) {
      Logger.error('Supabase function error:', error);
      throw new Error('Failed to analyze image: ' + error.message);
    }

    if (!data || !data.feedback) {
      Logger.error('Invalid response format:', data);
      throw new Error('Invalid response format from AI service');
    }

    const endTime = performance.now();
    Logger.debug(`Analysis completed in ${Math.round(endTime - startTime)}ms`);
    
    // Parse the analysis response
    const analysisData = parseAnalysis(data.feedback);
    const overallScore = data.overallScore || analysisData.overallScore || 85;
    
    // Add debug logging for tips
    console.log('🔍 DEBUG: Edge function response (first 1000 chars):', data.feedback.substring(0, 1000));
    console.log('🔍 DEBUG: Parsed analysis data:', analysisData);
    console.log('🔍 DEBUG: Tips parsed:', analysisData.tips?.length || 0, analysisData.tips);
    
    Logger.info(`${isOnboarding ? 'Onboarding' : 'Main'} AI analysis successful`, { overallScore });

    // Handle image URL - ALWAYS upload to Supabase for authenticated users
    let imageUrl: string;
    try {
      imageUrl = await uploadImageToSupabase(imageFile);
      Logger.info('Image uploaded to Supabase:', imageUrl);
    } catch (uploadError) {
      Logger.warn('Image upload failed, using local URL:', uploadError);
      imageUrl = URL.createObjectURL(imageFile);
    }
    
    // Save to database if not onboarding and user is authenticated  
    if (!isOnboarding) {
      const { data: userData } = await supabase.auth.getUser();
      if (userData && userData.user) {
        const dbAnalysisData = {
          user_id: userData.user.id,
          total_score: overallScore,
          raw_analysis: data.feedback,
          feedback: analysisData.summary || "Style analysis completed",
          breakdown: JSON.stringify(analysisData.breakdown || []),
          tips: JSON.stringify(analysisData.tips || []),
          image_url: imageUrl,
          thumbnail_url: imageUrl,
          scan_date: new Date().toISOString(),
        };
        
        try {
          const { error: insertError } = await supabase
            .from('style_analyses')
            .insert(dbAnalysisData);
            
          if (insertError) {
            Logger.error('Error saving analysis to database:', insertError);
          } else {
            Logger.info('Analysis saved to database successfully');
          }
        } catch (dbError) {
          Logger.error('Database error:', dbError);
        }
      }
    }

    const result: StyleAnalysisResult = {
      overallScore,
      rawAnalysis: data.feedback,
      imageUrl,
      breakdown: analysisData.breakdown || [],
      tips: analysisData.tips || [],
      summary: analysisData.summary || ""
    };
    
    // Update scan store for non-onboarding usage
    if (!isOnboarding) {
      const store = useScanStore.getState();
      store.setLatestScan(result);
    }
    
    return result;
  } catch (error) {
    Logger.error('Error analyzing style:', error);
    throw error;
  }
};

// Remove the mock onboarding function - use real analysis for everything
export const analyzeStyleForOnboarding = analyzeStyle;
