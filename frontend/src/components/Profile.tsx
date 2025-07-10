// frontend/src/components/Profile.tsx
import React, { useEffect, useState } from 'react';
import api from '../api';

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<{ username: string; email: string } | null>(null);

  useEffect(() => {
    api.get('/api/profile/')
      .then(response => setProfile(response.data))
      .catch(error => console.error("Failed to fetch profile", error));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.reload();
  };

  if (!profile) return <div>Loading profile...</div>;

  return (
    <div>
      <h2>Welcome, {profile.username}!</h2>
      <p>Email: {profile.email}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Profile;