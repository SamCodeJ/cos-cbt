import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { authAPI } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Save, User, Camera, Trash2, Upload } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  
  // Separate forms for profile and password
  const profileForm = useForm();
  const passwordForm = useForm();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await authAPI.me();
      setUser(userData);
      profileForm.setValue('name', userData.name);
      profileForm.setValue('email', userData.email);
    } catch (error) {
      toast.error('Failed to load user data');
    }
  };

  const onSubmitProfile = async (data) => {
    if (!data.name || !data.email) {
      toast.error('Name and email are required');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const updatedUser = await authAPI.updateProfile({
        name: data.name,
        email: data.email,
      });
      setUser(updatedUser);
      toast.success('Profile updated successfully');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onSubmitPassword = async (data) => {
    if (!data.current_password || !data.new_password || !data.confirm_password) {
      toast.error('All password fields are required');
      return;
    }

    if (data.new_password !== data.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    if (data.new_password.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await authAPI.changePassword(data.current_password, data.new_password);
      toast.success('Password updated successfully');
      passwordForm.reset();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to change password';
      toast.error(errorMessage);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload immediately
      handleUploadPicture(file);
    }
  };

  const handleUploadPicture = async (file) => {
    setIsUploadingPicture(true);
    try {
      const response = await authAPI.uploadProfilePicture(file);
      setUser(response.user);
      setPreviewImage(null);
      toast.success('Profile picture updated successfully');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to upload profile picture';
      toast.error(errorMessage);
      setPreviewImage(null);
    } finally {
      setIsUploadingPicture(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePicture = async () => {
    if (!confirm('Are you sure you want to delete your profile picture?')) {
      return;
    }

    setIsUploadingPicture(true);
    try {
      const response = await authAPI.deleteProfilePicture();
      setUser(response.user);
      toast.success('Profile picture deleted successfully');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to delete profile picture';
      toast.error(errorMessage);
    } finally {
      setIsUploadingPicture(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
          <p className="text-slate-600">Manage your account settings and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Profile Picture */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Upload or update your profile picture</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center">
                    {previewImage || user?.profile_picture ? (
                      <img
                        src={previewImage || `${API_BASE_URL}${user?.profile_picture}`}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-slate-400" />
                    )}
                  </div>
                  {isUploadingPicture && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPicture}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {user?.profile_picture ? 'Change Picture' : 'Upload Picture'}
                    </Button>
                    {user?.profile_picture && !isUploadingPicture && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDeletePicture}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    Recommended: Square image, at least 200x200px. Max size: 5MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Settings */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    {...profileForm.register('name', { required: true })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    {...profileForm.register('email', { required: true })}
                    placeholder="john@example.com"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="bg-amber-600 hover:bg-amber-700"
                  disabled={isUpdatingProfile}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isUpdatingProfile ? 'Saving...' : 'Save Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_password">Current Password</Label>
                  <Input
                    id="current_password"
                    type="password"
                    {...passwordForm.register('current_password')}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    {...passwordForm.register('new_password')}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    {...passwordForm.register('confirm_password')}
                    placeholder="••••••••"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="bg-amber-600 hover:bg-amber-700"
                  disabled={isUpdatingPassword}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">Account Type</span>
                  <span className="font-medium">
                    {user?.role === 'admin' ? 'Administrator' : 'Teacher'}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">Member Since</span>
                  <span className="font-medium">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

