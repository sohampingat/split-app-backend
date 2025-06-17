import React from 'react';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

const Groups: React.FC = () => {
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Groups
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Create Group
        </Button>
      </Box>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Coming Soon! 🚧
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Group management features are being developed. You'll be able to create groups, add members, and manage group expenses here.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Groups;