import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const Profile: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Profile
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Coming Soon! 🚧
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Profile management features are being developed. You'll be able to update your profile information here.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Profile;