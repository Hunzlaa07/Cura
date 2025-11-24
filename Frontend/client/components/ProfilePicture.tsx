import { useRef, useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

interface ProfilePictureProps {
  profilePicture?: string | null;
  fullName?: string;
  onUpdate?: (newUrl: string) => void;
}

export default function ProfilePicture({ profilePicture, fullName, onUpdate }: ProfilePictureProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(profilePicture || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with prop whenever it changes (e.g., on refresh or parent update)
  useEffect(() => {
    setImageUrl(profilePicture || "");
  }, [profilePicture]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append("photo", file); // Must match Multer field on backend

    try {
      setUploading(true);
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/applicants/profile/photo`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const uploadedUrl = res.data.profile_picture;
      setImageUrl(uploadedUrl);
      if (onUpdate) onUpdate(uploadedUrl); // Update parent state as well
    } catch (err) {
      console.error("Upload failed:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload photo.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
  <div className="flex items-center gap-3">
    <div
      onClick={handleClick}
      className="w-14 h-14 rounded-full overflow-hidden cursor-pointer border-2 border-gray-200 hover:opacity-80 transition flex items-center justify-center bg-gray-100"
    >
      {uploading ? (
        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
          Uploading...
        </div>
      ) : imageUrl ? (
        <img
          src={imageUrl}
          alt={fullName || "User"}
          className="w-full h-full object-cover"
        />
      ) : (
        // Default fallback (first letter of name or default image)
        <div className="w-full h-full flex items-center justify-center bg-merit-green">
          <span className="text-merit-dark text-lg font-semibold">
            {fullName?.charAt(0)?.toUpperCase() || "U"}
          </span>
        </div>
      )}
    </div>

    <input
      type="file"
      accept="image/*"
      ref={fileInputRef}
      className="hidden"
      onChange={handleChange}
    />
  </div>
);

}
