import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Upload, ImageIcon } from "lucide-react";
import socketService from "@/services/socketService";
import walletService from "@/services/walletService";
import { toast } from "sonner";

export function CreateToken() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    unitPrice: "",
    unitLimit: "",
  });
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(walletService.connected);
  const [tokenImage, setTokenImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDevelopment] = useState(window.location.hostname === 'localhost');

  useEffect(() => {
    const handleWalletConnect = (data: any) => {
      setConnected(data.connected);
    };

    walletService.addEventListener("connect", handleWalletConnect);
    walletService.addEventListener("disconnect", handleWalletConnect);

    return () => {
      walletService.removeEventListener("connect", handleWalletConnect);
      walletService.removeEventListener("disconnect", handleWalletConnect);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected) {
      toast.error("Wallet not connected", {
        description: "Please connect your wallet to create a token",
        action: {
          label: "Connect",
          onClick: () => walletService.connect(),
        },
      });
      return;
    }

    setLoading(true);
    try {
      const tokenAddress = await socketService.createToken(
        formData.name,
        formData.symbol,
        parseFloat(formData.unitPrice),
        parseInt(formData.unitLimit),
        walletService.wallet,
        tokenImage || undefined
      );
      
      toast.success("Token created successfully", {
        description: "You will be redirected to the token page",
      });
      
      // Navigate to the token detail page
      setTimeout(() => {
        navigate(`/tokens/${tokenAddress}`);
      }, 2000);
    } catch (error) {
      console.error("Create token error:", error);
      
      // Provide a more user-friendly error message for CORS issues
      if (error instanceof Error && error.message.includes("CORS")) {
        toast.error("Image upload failed", {
          description: "Custom image upload isn't supported in development mode due to CORS restrictions. Try creating a token without an image or run the app in production mode.",
        });
      } else {
        toast.error("Failed to create token", {
          description: error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image too large", {
          description: "Please upload an image smaller than 5MB"
        });
        return;
      }

      setTokenImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setTokenImage(null);
    setImagePreview(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Create New Token</CardTitle>
          {!connected && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => walletService.connect()}
            >
              <Wallet className="h-4 w-4 mr-2" />
              Connect Wallet
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Token Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="My Token"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="symbol">Token Symbol</Label>
              <Input
                id="symbol"
                name="symbol"
                placeholder="MTK"
                value={formData.symbol}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price (SOL)</Label>
              <Input
                id="unitPrice"
                name="unitPrice"
                type="number"
                step="0.000001"
                min="0"
                placeholder="0.1"
                value={formData.unitPrice}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitLimit">Unit Limit</Label>
              <Input
                id="unitLimit"
                name="unitLimit"
                type="number"
                min="1"
                placeholder="1000"
                value={formData.unitLimit}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Token Image (Optional)</Label>
              {isDevelopment && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-2 mb-3 text-sm text-amber-800">
                  <p className="font-medium">Development Mode Notice</p>
                  <p>Custom image uploads may not work due to CORS restrictions in development mode. A default image will be used instead.</p>
                </div>
              )}
              <div className="border rounded-md p-4 flex flex-col items-center justify-center">
                {imagePreview ? (
                  <div className="flex flex-col items-center gap-2">
                    <img 
                      src={imagePreview} 
                      alt="Token preview" 
                      className="w-32 h-32 object-cover rounded-md"
                    />
                    <p className="text-sm text-muted-foreground">
                      {tokenImage?.name}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      type="button"
                      onClick={removeImage}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="border-2 border-dashed border-muted-foreground/20 rounded-md w-32 h-32 flex items-center justify-center">
                      <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                    <Label 
                      htmlFor="image-upload" 
                      className="cursor-pointer flex items-center gap-1 text-sm bg-primary/10 hover:bg-primary/20 text-primary px-2 py-1 rounded-md"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload Image
                    </Label>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Max 5MB. PNG, JPG, SVG.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !connected}
            >
              {loading ? "Creating..." : "Create Token"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 