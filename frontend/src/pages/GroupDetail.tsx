import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { useParams } from 'react-router-dom';

const GroupDetail: React.FC = () => {
  const { id } = useParams();

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Group Details
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Coming Soon! 🚧
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Group detail page for group ID: {id}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default GroupDetail;