import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { Heart, Sparkles, Copy, ExternalLink } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import FloatingHearts from '../components/FloatingHearts';
import { Player } from '@lottiefiles/react-lottie-player';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const characterOptions = [
  {
    id: 'panda',
    name: 'Cute Panda',
    lottieUrl: 'https://lottie.host/e1e68e5a-44a5-4a8e-8c1e-90f4f239f60f/BKqAJ58qKQ.json',
    emoji: '🐼',
  },
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
    image: 'https://media.tenor.com/H8oJvzwt1bMAAAAj/sappy-seals.gif',
  },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [valentineName, setValentineName] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState('panda');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!valentineName.trim()) {
      toast.error("Please enter your Valentine's name");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API}/proposals`, {
        valentine_name: valentineName.trim(),
        custom_message: customMessage.trim() || 'Will you be my Valentine?',
        character_choice: selectedCharacter,
      });

      const proposalId = response.data.id;
      const link = `${window.location.origin}/proposal/${proposalId}`;
      setGeneratedLink(link);
      toast.success('Your proposal link is ready!');
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast.error('Failed to create proposal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success('Link copied to clipboard!');
  };

  const openProposal = () => {
    window.open(generatedLink, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#FFF0F5] relative overflow-hidden">
      <FloatingHearts />
      
      <div className="relative z-10 container mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 md:mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="text-[#FF4D6D] fill-[#FF4D6D]" size={32} />
            <h1 className="font-heading text-3xl md:text-5xl font-extrabold text-[#FF4D6D]">
              Valentine Proposal
            </h1>
            <Heart className="text-[#FF4D6D] fill-[#FF4D6D]" size={32} />
          </div>
          <p className="font-body text-gray-600 text-base md:text-lg max-w-xl mx-auto">
            Create a magical, personalized Valentine's proposal and share it with your special someone!
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-lg mx-auto"
        >
          <Card className="valentine-card border-0 shadow-[0_20px_50px_rgba(255,77,109,0.15)]">
            <CardHeader className="text-center pb-2">
              <CardTitle className="font-heading text-2xl text-[#FF4D6D] flex items-center justify-center gap-2">
                <Sparkles size={24} />
                Create Your Proposal
                <Sparkles size={24} />
              </CardTitle>
              <CardDescription className="font-body text-gray-500">
                Fill in the details below to generate your unique link
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!generatedLink ? (
                <form onSubmit={handleSubmit} className="space-y-6">
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
                    <div className="grid grid-cols-3 gap-3">
                      {characterOptions.map((char) => (
                        <motion.button
                          key={char.id}
                          type="button"
                          data-testid={`character-${char.id}`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedCharacter(char.id)}
                          className={`p-3 rounded-2xl border-2 transition-all ${
                            selectedCharacter === char.id
                              ? 'border-[#FF4D6D] bg-pink-50 shadow-md'
                              : 'border-pink-100 bg-white hover:border-pink-200'
                          }`}
                        >
                          <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center overflow-hidden rounded-xl">
                            {char.lottieUrl ? (
                              <Player
                                autoplay
                                loop
                                src={char.lottieUrl}
                                style={{ width: '100%', height: '100%' }}
                              />
                            ) : char.image ? (
                              <img 
                                src={char.image} 
                                alt={char.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-4xl">{char.emoji}</span>
                            )}
                          </div>
                          <span className="font-body text-sm text-gray-600 font-medium">
                            {char.name}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    data-testid="create-proposal-btn"
                    disabled={isLoading}
                    className="w-full valentine-btn-yes py-6 text-lg font-bold"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Heart size={20} />
                        </motion.span>
                        Creating Magic...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Heart size={20} className="fill-white" />
                        Generate Proposal Link
                      </span>
                    )}
                  </Button>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6 text-center"
                >
                  <div className="text-6xl mb-4">
                    <Heart className="text-[#FF4D6D] fill-[#FF4D6D] mx-auto animate-pulse" size={64} />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-[#FF4D6D]">
                    Your Proposal is Ready!
                  </h3>
                  <p className="font-body text-gray-600 text-sm">
                    Share this link with {valentineName} and watch the magic happen!
                  </p>
                  
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
                      data-testid="preview-link-btn"
                      variant="outline"
                      className="flex-1 border-[#FF4D6D] text-[#FF4D6D] hover:bg-pink-50"
                    >
                      <ExternalLink size={18} className="mr-2" />
                      Preview
                    </Button>
                  </div>

                  <Button
                    onClick={() => {
                      setGeneratedLink('');
                      setValentineName('');
                      setCustomMessage('');
                      setSelectedCharacter('panda');
                    }}
                    data-testid="create-another-btn"
                    variant="ghost"
                    className="text-gray-500 hover:text-[#FF4D6D]"
                  >
                    Create Another Proposal
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-8 font-body text-gray-400 text-sm"
        >
          Made with <Heart className="inline text-[#FF4D6D] fill-[#FF4D6D]" size={14} /> for your special someone
        </motion.p>
      </div>
    </div>
  );
};

export default HomePage;
