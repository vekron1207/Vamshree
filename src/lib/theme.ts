import { createTheme } from "@mui/material/styles";

// Material components in Vaamshri's own colours: forest green and gold, pill-shaped
// buttons, underlined fields and slow, soft motion.
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export const theme = createTheme({
  cssVariables: false,
  palette: {
    mode: "light",
    primary: { main: "#0e3b22", dark: "#06140c", light: "#2b6a45", contrastText: "#ffffff" },
    secondary: { main: "#c9a355", light: "#e8ce9a", dark: "#a8843b", contrastText: "#06140c" },
    error: { main: "#7a3426" },
    text: { primary: "#12140f", secondary: "rgba(18, 20, 15, 0.6)" },
    background: { default: "#ffffff", paper: "#ffffff" },
    divider: "rgba(18, 20, 15, 0.12)",
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: "var(--font-roboto), Roboto, system-ui, sans-serif",
    fontSize: 14,
    button: { textTransform: "uppercase", letterSpacing: "0.16em", fontWeight: 500 },
  },
  transitions: {
    easing: { easeInOut: EASE, easeOut: EASE, easeIn: "cubic-bezier(0.4, 0, 1, 1)", sharp: "cubic-bezier(0.4, 0, 0.6, 1)" },
    duration: { shortest: 150, shorter: 220, short: 300, standard: 380, complex: 450, enteringScreen: 320, leavingScreen: 220 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontSize: 12,
          padding: "11px 30px",
          transition: `background-color 300ms ${EASE}, transform 300ms ${EASE}, box-shadow 300ms ${EASE}, color 300ms ${EASE}, border-color 300ms ${EASE}`,
          "&:hover": { transform: "translateY(-1px)" },
          "&:active": { transform: "translateY(0) scale(0.99)" },
        },
        sizeSmall: { padding: "7px 18px", fontSize: 11 },
        sizeLarge: { padding: "15px 36px" },
        outlined: { borderColor: "rgba(14, 59, 34, 0.35)" },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { transition: `background-color 300ms ${EASE}, transform 300ms ${EASE}` } },
    },
    MuiTextField: { defaultProps: { variant: "standard", fullWidth: true } },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", "&.Mui-focused": { color: "#0e3b22" } },
      },
    },
    MuiInput: {
      styleOverrides: {
        root: {
          "&:before": { borderBottomColor: "rgba(18, 20, 15, 0.2)" },
          "&:hover:not(.Mui-disabled, .Mui-error):before": { borderBottomColor: "rgba(14, 59, 34, 0.55)" },
          "&:after": { borderBottomColor: "#0e3b22" },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 12, backgroundColor: "#ffffff" },
        notchedOutline: { borderColor: "rgba(18, 20, 15, 0.16)" },
      },
    },
    MuiSelect: { defaultProps: { MenuProps: { transitionDuration: 260, slotProps: { paper: { elevation: 8 } } } } },
    MuiMenu: {
      styleOverrides: {
        paper: { borderRadius: 14, marginTop: 6, border: "1px solid rgba(18, 20, 15, 0.08)" },
        list: { padding: 6 },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontSize: 14,
          transition: `background-color 200ms ${EASE}`,
          "&.Mui-selected": { backgroundColor: "rgba(14, 59, 34, 0.08)" },
          "&.Mui-selected:hover": { backgroundColor: "rgba(14, 59, 34, 0.12)" },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          height: 36,
          transition: `background-color 300ms ${EASE}, color 300ms ${EASE}, border-color 300ms ${EASE}, transform 300ms ${EASE}`,
        },
      },
    },
    MuiPaper: { styleOverrides: { rounded: { borderRadius: 16 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 20 } } },
    MuiDrawer: { styleOverrides: { paper: { backgroundColor: "#ffffff" } } },
    MuiSwitch: {
      styleOverrides: {
        switchBase: { "&.Mui-checked": { color: "#0e3b22" }, "&.Mui-checked + .MuiSwitch-track": { backgroundColor: "#0e3b22" } },
      },
    },
    MuiCheckbox: { defaultProps: { color: "primary" } },
    MuiRadio: { defaultProps: { color: "primary" } },
    MuiTab: { styleOverrides: { root: { textTransform: "uppercase", letterSpacing: "0.12em", fontSize: 12, minHeight: 44 } } },
    MuiTooltip: { styleOverrides: { tooltip: { fontSize: 12, borderRadius: 10 } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 14 } } },
    MuiSkeleton: { defaultProps: { animation: "wave" } },
  },
});
