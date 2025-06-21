// routes
import Router from './routes';
// theme
// import ThemeProvider from './theme'; // OLD
import SharedThemeProvider from '../../packages/ui-theme'; // NEW - Assuming App.js is in wms/src/
// components
import ScrollToTop from './components/ScrollToTop';
import { BaseOptionChartStyle } from './components/chart/BaseOptionChart';

// ----------------------------------------------------------------------

export default function App() {
  return (
    <SharedThemeProvider mode="light"> {/* NEW - can also try "dark" to test */}
      <ScrollToTop />
      <BaseOptionChartStyle />
      <Router />
    </SharedThemeProvider>
  );
}
