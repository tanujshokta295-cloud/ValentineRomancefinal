import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { Heart, Sparkles, Copy, ExternalLink, CreditCard, Lock, ArrowLeft, Check } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import FloatingHearts from '../components/FloatingHearts';
import ProposalCard from '../components/ProposalCard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const RAZORPAY_KEY_ID = process.env.REACT_APP_RAZORPAY_KEY_ID;

const characterOptions = [
  {
    id: 'bear',
    name: 'Couple Teddy',
    emoji: '🧸',
    image: 'https://customer-assets.emergentagent.com/job_cutematch-1/artifacts/ur3y0r94_couple-teddy-4096926_1280.jpg',
  },
  {
    id: 'seal',
    name: 'Sappy Seals',
    emoji: '🦭',
    image: 'https://customer-assets.emergentagent.com/job_cutematch-1/artifacts/6uhb61yp_sappy-seals.gif',
  },
];

const PRICE_INR = 249;
const PRICE_DISPLAY = "₹249";

// Load Razorpay script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const HomePage = () => {
  // Form state
  const [valentineName, setValentineName] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState('bear');
  
  // Flow state
  const [step, setStep] = useState('form'); // 'form' | 'preview' | 'success'
  const [generatedLink, setGeneratedLink] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handlePreview = (e) => {
    e.preventDefault();
    
    if (!valentineName.trim()) {
      toast.error("Please enter your Valentine's name");
      return;
    }

    setStep('preview');
  };

  const handlePayment = useCallback(async () => {
    setIsProcessingPayment(true);
    
    // Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      toast.error('Failed to load payment gateway. Please try again.');
      setIsProcessingPayment(false);
      return;
    }

    try {
      // Step 1: Create order on backend
      const orderResponse = await axios.post(`${API}/payments/create-order`, {
        valentine_name: valentineName.trim(),
        custom_message: customMessage.trim() || 'Will you be my Valentine?',
        character_choice: selectedCharacter,
      });

      const { order_id, amount, currency, key_id, proposal_id } = orderResponse.data;

      // Step 2: Open Razorpay checkout
      const options = {
        key: key_id || RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        name: "Valentine Proposal",
        description: `Proposal for ${valentineName}`,
        order_id: order_id,
        handler: async (response) => {
          // Step 3: Verify payment on backend
          try {
            const verifyResponse = await axios.post(`${API}/payments/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              proposal_id: proposal_id,
            });

            if (verifyResponse.data.success) {
              const link = `${window.location.origin}/proposal/${proposal_id}`;
              setGeneratedLink(link);
              setStep('success');
              setIsProcessingPayment(false);
              toast.success('Payment successful! Your link is ready! 🎉');
            }
          } catch (verifyError) {
            console.error('Payment verification failed:', verifyError);
            toast.error('Payment verification failed. Please contact support.');
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          name: "",
          email: "",
          contact: ""
        },
        theme: {
          color: "#FF4D6D"
        },
        modal: {
          ondismiss: () => {
            setIsProcessingPayment(false);
            toast.error('Payment cancelled');
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', (response) => {
        console.error('Payment failed:', response.error);
        toast.error(`Payment failed: ${response.error.description}`);
        setIsProcessingPayment(false);
      });
      
      razorpayInstance.open();

    } catch (error) {
      console.error('Error creating payment order:', error);
      toast.error('Failed to initiate payment. Please try again.');
      setIsProcessingPayment(false);
    }
  }, [valentineName, customMessage, selectedCharacter]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success('Link copied to clipboard!');
  };

  const openProposal = () => {
    window.open(generatedLink, '_blank');
  };

  const resetForm = () => {
    setStep('form');
    setGeneratedLink('');
    setValentineName('');
    setCustomMessage('');
    setSelectedCharacter('bear');
    setIsProcessingPayment(false);
  };

  return (
    <div className="min-h-screen bg-[#FFF0F5] relative overflow-hidden">
      <FloatingHearts />
      
      <div className="relative z-10 container mx-auto px-4 py-6 md:py-12">
        {/* Header */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 md:mb-10"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Heart className="text-[#FF4D6D] fill-[#FF4D6D]" size={28} />
            <h1 className="font-heading text-2xl md:text-4xl font-extrabold text-[#FF4D6D]">
              Valentine Proposal
            </h1>
            <Heart className="text-[#FF4D6D] fill-[#FF4D6D]" size={28} />
          </div>
          <p className="font-body text-gray-600 text-sm md:text-base max-w-xl mx-auto">
            Create a magical, personalized Valentine's proposal for your special someone!
          </p>
        </motion.div>

        {/* Step 1: Form */}
        {step === 'form' && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-lg mx-auto"
          >
            <Card className="valentine-card border-0 shadow-[0_20px_50px_rgba(255,77,109,0.15)]">
              <CardHeader className="text-center pb-2">
                <CardTitle className="font-heading text-xl md:text-2xl text-[#FF4D6D] flex items-center justify-center gap-2">
                  <Sparkles size={20} />
                  Create Your Proposal
                  <Sparkles size={20} />
                </CardTitle>
                <CardDescription className="font-body text-gray-500 text-sm">
                  Fill in the details to see your proposal preview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePreview} className="space-y-5">
                  {/* Valentine's Name */}
                  <div className="space-y-2">
                    <Label htmlFor="valentineName" className="font-body font-semibold text-gray-700">
                      Valentine's Name *
                    </Label>
                    <Input
                      id="valentineName"
                      data-testid="valentine-name-input"
                      placeholder="Enter their name..."
                      value={valentineName}
                      onChange={(e) => setValentineName(e.target.value)}
                      className="font-body border-pink-200 focus:border-[#FF4D6D] focus:ring-[#FF4D6D]"
                      maxLength={100}
                    />
                  </div>

                  {/* Custom Message */}
                  <div className="space-y-2">
                    <Label htmlFor="customMessage" className="font-body font-semibold text-gray-700">
                      Custom Message (optional)
                    </Label>
                    <Textarea
                      id="customMessage"
                      data-testid="custom-message-input"
                      placeholder="Will you be my Valentine?"
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      className="font-body border-pink-200 focus:border-[#FF4D6D] focus:ring-[#FF4D6D] resize-none"
                      rows={3}
                      maxLength={500}
                    />
                  </div>

                  {/* Character Selection */}
                  <div className="space-y-3">
                    <Label className="font-body font-semibold text-gray-700">
                      Choose a Character
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      {characterOptions.map((char) => (
                        <motion.button
                          key={char.id}
                          type="button"
                          data-testid={`character-${char.id}`}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setSelectedCharacter(char.id)}
                          className={`p-3 rounded-2xl border-2 transition-all ${
                            selectedCharacter === char.id
                              ? 'border-[#FF4D6D] bg-pink-50 shadow-md'
                              : 'border-pink-100 bg-white hover:border-pink-200'
                          }`}
                        >
                          <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center overflow-hidden rounded-xl">
                            <img 
                              src={char.image} 
                              alt={char.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="font-body text-xs text-gray-600 font-medium">
                            {char.name}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Preview Button */}
                  <Button
                    type="submit"
                    data-testid="preview-btn"
                    className="w-full valentine-btn-yes py-5 text-base font-bold"
                  >
                    <span className="flex items-center gap-2">
                      <Heart size={18} className="fill-white" />
                      Preview My Proposal
                    </span>
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Preview + Payment */}
        {step === 'preview' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => setStep('form')}
              className="text-gray-500 hover:text-[#FF4D6D] -ml-2"
              data-testid="back-btn"
            >
              <ArrowLeft size={18} className="mr-1" />
              Edit Details
            </Button>

            {/* Preview Card */}
            <div className="relative">
              <ProposalCard
                valentineName={valentineName}
                customMessage={customMessage || 'Will you be my Valentine?'}
                characterChoice={selectedCharacter}
                isPreview={true}
              />
            </div>

            {/* Payment Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="valentine-card border-0 shadow-[0_15px_40px_rgba(255,77,109,0.15)]">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <h3 className="font-heading text-xl font-bold text-gray-800">
                      Love what you see? 💕
                    </h3>
                    <p className="font-body text-gray-600 text-sm">
                      Get your unique shareable link to send to your Valentine!
                    </p>

                    {/* Price */}
                    <div className="bg-pink-50 rounded-2xl p-4 inline-block">
                      <span className="font-heading text-3xl font-extrabold text-[#FF4D6D]">
                        {PRICE_DISPLAY}
                      </span>
                      <span className="font-body text-gray-500 text-sm ml-2">
                        one-time
                      </span>
                    </div>

                    {/* Features */}
                    <div className="flex flex-col items-center gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-green-500" />
                        <span>Unique shareable link</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-green-500" />
                        <span>Works on all devices</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-green-500" />
                        <span>Never expires</span>
                      </div>
                    </div>

                    {/* Payment Button */}
                    <Button
                      onClick={handlePayment}
                      disabled={isProcessingPayment}
                      data-testid="pay-btn"
                      className="w-full max-w-xs valentine-btn-yes py-5 text-base font-bold"
                    >
                      {isProcessingPayment ? (
                        <span className="flex items-center gap-2">
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <Heart size={18} />
                          </motion.span>
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <CreditCard size={18} />
                          Pay {PRICE_DISPLAY} & Get Link
                        </span>
                      )}
                    </Button>

                    {/* Payment methods info */}
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                      <Lock size={12} />
                      <span>Secure payment via Razorpay</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      UPI • Cards • Net Banking • Wallets
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* Step 3: Success - Link Generated */}
        {step === 'success' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-lg mx-auto"
          >
            <Card className="valentine-card border-0 shadow-[0_20px_50px_rgba(255,77,109,0.15)]">
              <CardContent className="p-8 text-center space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                >
                  <Heart className="text-[#FF4D6D] fill-[#FF4D6D] mx-auto" size={64} />
                </motion.div>
                
                <div>
                  <h3 className="font-heading text-2xl font-bold text-[#FF4D6D] mb-2">
                    Your Proposal is Ready! 🎉
                  </h3>
                  <p className="font-body text-gray-600 text-sm">
                    Share this link with {valentineName} and watch the magic happen!
                  </p>
                </div>
                
                <div className="bg-pink-50 p-4 rounded-xl break-all">
                  <p 
                    className="font-body text-sm text-gray-700"
                    data-testid="generated-link"
                  >
                    {generatedLink}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={copyToClipboard}
                    data-testid="copy-link-btn"
                    className="flex-1 bg-[#FF4D6D] hover:bg-[#FF3355] text-white"
                  >
                    <Copy size={18} className="mr-2" />
                    Copy Link
                  </Button>
                  <Button
                    onClick={openProposal}
                    data-testid="open-link-btn"
                    variant="outline"
                    className="flex-1 border-[#FF4D6D] text-[#FF4D6D] hover:bg-pink-50"
                  >
                    <ExternalLink size={18} className="mr-2" />
                    Open
                  </Button>
                </div>

                <Button
                  onClick={resetForm}
                  data-testid="create-another-btn"
                  variant="ghost"
                  className="text-gray-500 hover:text-[#FF4D6D]"
                >
                  Create Another Proposal
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-8 font-body text-gray-400 text-xs"
        >
          Made with <Heart className="inline text-[#FF4D6D] fill-[#FF4D6D]" size={12} /> for your special someone
        </motion.p>
      </div>
    </div>
  );
};

export default HomePage;
