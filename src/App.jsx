import { Box, Container, Typography } from '@mui/material';
import EmployeeListExample from './pages/EmployeeListExample/EmployeeListExample';

function App() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: 5,
        px: 2,
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            color="text.primary"
            sx={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block',
            }}
          >
            MAYS SRM
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Supplier Relationship Management — Abstract List Demo
          </Typography>
        </Box>

        <EmployeeListExample />
      </Container>
    </Box>
  );
}

export default App;
