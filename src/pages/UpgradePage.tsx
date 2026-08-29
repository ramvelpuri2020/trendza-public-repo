import { ProOfferCard } from "../components/onboarding/ProOfferCard";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const UpgradePage = () => {
  const navigate = useNavigate();

  const handleContinue = () => {
    toast({
      title: "Welcome to Premium!",
      description: "Your subscription is now active.",
    });
    navigate('/profile');
  };

  const handleSkipToFreeTier = () => {
    toast({
      title: "Back to Free Plan",
      description: "You can upgrade anytime from your profile.",
    });
    // Safe fallback — go back if there's history, otherwise profile
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/profile');
    }
  };

  return (
    <ProOfferCard
      onContinue={handleContinue}
      onSkipToFreeTier={handleSkipToFreeTier}
    />
  );
};

export default UpgradePage;
