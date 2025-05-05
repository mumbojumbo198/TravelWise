import { MD3LightTheme, configureFonts } from 'react-native-paper';

// Define our custom fonts
const fontConfig = {
  fontFamily: 'System',
};

// Define our brand colors
const colors = {
  primary: '#4a148c', // Deep purple
  primaryLight: '#7c43bd',
  primaryDark: '#12005e',
  secondary: '#ff6d00', // Vibrant orange
  secondaryLight: '#ff9e40',
  secondaryDark: '#c43c00',
  background: '#f5f5f5',
  surface: '#ffffff',
  error: '#b00020',
  text: '#212121',
  onSurface: '#212121',
  disabled: '#9e9e9e',
  placeholder: '#757575',
  backdrop: 'rgba(0, 0, 0, 0.5)',
  notification: '#ff6d00',
};

// Create our theme
const theme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    ...colors,
  },
  // Custom theme properties
  roundness: 8,
  animation: {
    scale: 1.0,
  },
  // Custom spacing
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
  },
  // Custom shadows
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 5,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

// Common styles that can be reused across the app
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.m,
  },
  card: {
    marginBottom: theme.spacing.m,
    borderRadius: theme.roundness,
    ...theme.shadows.small,
  },
  header: {
    height: 250,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    justifyContent: 'flex-end',
    padding: theme.spacing.m,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: theme.spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    marginBottom: theme.spacing.s,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: theme.spacing.m,
    color: theme.colors.primary,
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.m,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.m,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: theme.spacing.s,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  divider: {
    height: 1,
    marginVertical: theme.spacing.s,
  },
};

export default theme;
