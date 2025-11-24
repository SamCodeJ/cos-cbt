import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Card, ActivityIndicator, Divider, IconButton } from 'react-native-paper';
import { candidateAPI } from '../api/client';
import { useAuthStore } from '../store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const API_BASE_URL = 'http://10.57.236.125:3000'; // Use your computer's IP

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  
  // Profile form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const { setCandidate, logout } = useAuthStore();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await candidateAPI.getProfile();
      setProfile(data);
      setName(data.name);
      setEmail(data.email);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!name || !email) {
      Alert.alert('Validation Error', 'Name and email are required');
      return;
    }

    setIsSaving(true);
    try {
      const updatedProfile = await candidateAPI.updateProfile({ name, email });
      setProfile(updatedProfile);
      setCandidate(updatedProfile);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update profile';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Validation Error', 'All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Validation Error', 'New password must be at least 6 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      await candidateAPI.changePassword(currentPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      const errorMessage = error.response?.data?.error || 'Failed to change password';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      handleUploadPicture(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      handleUploadPicture(result.assets[0].uri);
    }
  };

  const handleUploadPicture = async (uri) => {
    setIsUploadingPicture(true);
    try {
      const response = await candidateAPI.uploadProfilePicture(uri);
      setProfile(response.user);
      setCandidate(response.user);
      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading picture:', error);
      Alert.alert('Error', 'Failed to upload profile picture');
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const handleDeletePicture = async () => {
    Alert.alert(
      'Delete Picture',
      'Are you sure you want to delete your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsUploadingPicture(true);
            try {
              const response = await candidateAPI.deleteProfilePicture();
              setProfile(response.user);
              setCandidate(response.user);
              Alert.alert('Success', 'Profile picture deleted successfully');
            } catch (error) {
              console.error('Error deleting picture:', error);
              Alert.alert('Error', 'Failed to delete profile picture');
            } finally {
              setIsUploadingPicture(false);
            }
          },
        },
      ]
    );
  };

  const showImageOptions = () => {
    Alert.alert(
      'Profile Picture',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Choose from Library', onPress: handlePickImage },
        profile?.profile_picture && { text: 'Delete Picture', onPress: handleDeletePicture, style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ].filter(Boolean)
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('auth_token');
            await AsyncStorage.removeItem('candidate');
            logout();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button 
          mode="text" 
          onPress={() => navigation.goBack()}
          icon="arrow-left"
          textColor="#d97706"
        >
          Back
        </Button>
        <Text variant="headlineMedium" style={styles.title}>Profile</Text>
        <Button 
          mode="text" 
          onPress={handleLogout}
          textColor="#ef4444"
        >
          Logout
        </Button>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Picture */}
        <Card style={styles.card}>
          <Card.Title title="Profile Picture" />
          <Card.Content>
            <View style={styles.profilePictureContainer}>
              <TouchableOpacity 
                onPress={showImageOptions}
                style={styles.profilePictureWrapper}
                disabled={isUploadingPicture}
              >
                <View style={styles.profilePicture}>
                  {profile?.profile_picture ? (
                    <Image
                      source={{ uri: `${API_BASE_URL}${profile.profile_picture}` }}
                      style={styles.profileImage}
                    />
                  ) : (
                    <View style={styles.profilePlaceholder}>
                      <Text style={styles.profilePlaceholderText}>
                        {profile?.name?.charAt(0).toUpperCase() || 'U'}
                      </Text>
                    </View>
                  )}
                  {isUploadingPicture && (
                    <View style={styles.uploadingOverlay}>
                      <ActivityIndicator size="small" color="#fff" />
                    </View>
                  )}
                  <View style={styles.cameraIcon}>
                    <IconButton
                      icon="camera"
                      size={20}
                      iconColor="#fff"
                      style={styles.cameraIconButton}
                    />
                  </View>
                </View>
              </TouchableOpacity>
              <Text style={styles.profilePictureHint}>
                Tap to change picture
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Profile Information */}
        <Card style={styles.card}>
          <Card.Title title="Profile Information" />
          <Card.Content>
            <TextInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            {profile?.student_id && (
              <TextInput
                label="Student ID"
                value={profile.student_id}
                mode="outlined"
                editable={false}
                style={styles.input}
              />
            )}
            <Button
              mode="contained"
              onPress={handleUpdateProfile}
              loading={isSaving}
              disabled={isSaving}
              style={styles.button}
              buttonColor="#d97706"
            >
              {isSaving ? 'Saving...' : 'Update Profile'}
            </Button>
          </Card.Content>
        </Card>

        {/* Change Password */}
        <Card style={styles.card}>
          <Card.Title title="Change Password" />
          <Card.Content>
            <TextInput
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              mode="outlined"
              secureTextEntry
              style={styles.input}
            />
            <TextInput
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              mode="outlined"
              secureTextEntry
              style={styles.input}
            />
            <TextInput
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry
              style={styles.input}
            />
            <Button
              mode="contained"
              onPress={handleChangePassword}
              loading={isChangingPassword}
              disabled={isChangingPassword}
              style={styles.button}
              buttonColor="#d97706"
            >
              {isChangingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </Card.Content>
        </Card>

        {/* Account Information */}
        <Card style={styles.card}>
          <Card.Title title="Account Information" />
          <Card.Content>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account Type:</Text>
              <Text style={styles.infoValue}>Candidate</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Member Since:</Text>
              <Text style={styles.infoValue}>
                {profile?.created_at 
                  ? new Date(profile.created_at).toLocaleDateString() 
                  : 'N/A'}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  divider: {
    marginVertical: 8,
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  profilePictureWrapper: {
    position: 'relative',
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#d97706',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#d97706',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconButton: {
    margin: 0,
  },
  profilePictureHint: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
  },
});

