import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserOnboardingData {
  id: string;
  username: string | null;
  age_range: string | null;
  main_goal: string | null;
  onboarding_completed: boolean | null;
  created_at: string;
  updated_at: string | null;
}

interface StyleAnalysisData {
  id: string;
  user_id: string | null;
  total_score: number;
  breakdown: any;
  tips: any;
  image_url: string | null;
  scan_date: string | null;
  feedback: string | null;
}

export function OnboardingInspector() {
  const [users, setUsers] = useState<UserOnboardingData[]>([]);
  const [analyses, setAnalyses] = useState<StyleAnalysisData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchUserId, setSearchUserId] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserOnboardingData | null>(null);

  // Load all users with onboarding data
  const loadAllUsers = async () => {
    setLoading(true);
    try {
      console.log('🔍 Loading all users onboarding data...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          age_range,
          main_goal,
          onboarding_completed,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('📊 Loaded users:', data);
      setUsers(data || []);
    } catch (error) {
      console.error('❌ Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load specific user by ID
  const loadUserById = async (userId: string) => {
    if (!userId.trim()) return;

    setLoading(true);
    try {
      console.log('🔍 Loading user by ID:', userId);
      
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          age_range,
          main_goal,
          onboarding_completed,
          created_at,
          updated_at
        `)
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profile) {
        setSelectedUser(profile);
        
        // Get user's style analyses
        const { data: userAnalyses, error: analysesError } = await supabase
          .from('style_analyses')
          .select(`
            id,
            user_id,
            total_score,
            breakdown,
            tips,
            image_url,
            scan_date,
            feedback
          `)
          .eq('user_id', userId)
          .order('scan_date', { ascending: false });

        if (analysesError) {
          console.error('❌ Error loading analyses:', analysesError);
        } else {
          setAnalyses(userAnalyses || []);
        }

        console.log('👤 User data:', profile);
        console.log('📸 User analyses:', userAnalyses);
      } else {
        console.log('❌ User not found');
        setSelectedUser(null);
        setAnalyses([]);
      }
    } catch (error) {
      console.error('❌ Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load on mount
  useEffect(() => {
    loadAllUsers();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getOnboardingStatus = (user: UserOnboardingData) => {
    if (user.onboarding_completed) {
      return <Badge className="bg-green-500">Completed</Badge>;
    } else if (user.age_range || user.main_goal) {
      return <Badge className="bg-yellow-500">In Progress</Badge>;
    } else {
      return <Badge className="bg-gray-500">Not Started</Badge>;
    }
  };

  const getCompletionPercentage = (user: UserOnboardingData) => {
    let completed = 0;
    const total = 4; // age, goal, photo, payment
    
    if (user.age_range) completed++;
    if (user.main_goal) completed++;
    if (user.onboarding_completed) completed += 2; // Assuming photo + payment if completed
    
    return Math.round((completed / total) * 100);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🔍 Onboarding Inspector</h1>
        <p className="text-gray-600">View user onboarding progress and answers</p>
      </div>

      <Tabs defaultValue="all-users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all-users">All Users</TabsTrigger>
          <TabsTrigger value="specific-user">Specific User</TabsTrigger>
        </TabsList>

        <TabsContent value="all-users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">All Users ({users.length})</h2>
            <Button onClick={loadAllUsers} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>

          <div className="grid gap-4">
            {users.map((user) => (
              <Card key={user.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <strong>{user.username || 'Unknown User'}</strong>
                      {getOnboardingStatus(user)}
                      <span className="text-sm text-gray-500">
                        {getCompletionPercentage(user)}% complete
                      </span>
                    </div>
                    
                    <div className="text-sm space-y-1">
                      <div><strong>User ID:</strong> {user.id}</div>
                      <div><strong>Age Range:</strong> {user.age_range || '❌ Not answered'}</div>
                      <div><strong>Main Goal:</strong> {user.main_goal || '❌ Not answered'}</div>
                      <div><strong>Joined:</strong> {formatDate(user.created_at)}</div>
                      {user.updated_at && (
                        <div><strong>Last Updated:</strong> {formatDate(user.updated_at)}</div>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSearchUserId(user.id);
                      loadUserById(user.id);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="specific-user" className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter User ID..."
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={() => loadUserById(searchUserId)}
              disabled={loading || !searchUserId.trim()}
            >
              {loading ? 'Loading...' : 'Search'}
            </Button>
          </div>

          {selectedUser && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    👤 User Details
                    {getOnboardingStatus(selectedUser)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div><strong>User ID:</strong> {selectedUser.id}</div>
                  <div><strong>Username:</strong> {selectedUser.username || 'Not set'}</div>
                  <div><strong>Age Range:</strong> {selectedUser.age_range || '❌ Not answered'}</div>
                  <div><strong>Main Goal:</strong> {selectedUser.main_goal || '❌ Not answered'}</div>
                  <div><strong>Onboarding Completed:</strong> {selectedUser.onboarding_completed ? '✅ Yes' : '❌ No'}</div>
                  <div><strong>Account Created:</strong> {formatDate(selectedUser.created_at)}</div>
                  {selectedUser.updated_at && (
                    <div><strong>Last Updated:</strong> {formatDate(selectedUser.updated_at)}</div>
                  )}
                  <div><strong>Completion:</strong> {getCompletionPercentage(selectedUser)}%</div>
                </CardContent>
              </Card>

              {analyses.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>📸 Style Analyses ({analyses.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analyses.map((analysis) => (
                        <div key={analysis.id} className="border rounded p-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <strong>Overall Score: {analysis.total_score}/100</strong>
                            <span className="text-sm text-gray-500">
                              {analysis.scan_date ? formatDate(analysis.scan_date) : 'No date'}
                            </span>
                          </div>
                          
                          {analysis.image_url && (
                            <div>
                              <strong>Image:</strong>{' '}
                              <a 
                                href={analysis.image_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                              >
                                View Photo
                              </a>
                            </div>
                          )}
                          
                          {analysis.feedback && (
                            <div>
                              <strong>Feedback:</strong> {analysis.feedback}
                            </div>
                          )}
                          
                          {analysis.breakdown && (
                            <div>
                              <strong>Breakdown:</strong>
                              <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
                                {JSON.stringify(JSON.parse(analysis.breakdown), null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Development Helper */}
      <Card className="mt-8 bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-800">🛠️ Developer Tools</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-yellow-700">
          <p><strong>Current Schema Fields Available:</strong></p>
          <ul className="list-disc ml-5 mt-2">
            <li><code>age_range</code> - User's selected age range</li>
            <li><code>main_goal</code> - User's main style goal</li>
            <li><code>onboarding_completed</code> - Boolean completion flag</li>
            <li><code>style_analyses</code> table - Photo uploads and AI analysis results</li>
          </ul>
          <p className="mt-3">
            <strong>Missing fields we need:</strong> Current step tracking, payment status, photo upload status
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 