import React, { useState, useContext } from "react";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { postRegisterForm } from "../../api/api";
import { AccountContext } from "../../context/AccountProvider";
import { useNavigate } from "react-router-dom";
import { Snackbar } from "@mui/material";

function Copyright(props) {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      align="center"
      {...props}
    >
      {"Copyright © "}
      <Link color="inherit" href="https://mui.com/">
        StaGreen
      </Link>{" "}
      {new Date().getFullYear()}.
    </Typography>
  );
}

const theme = createTheme({
  components: {
    MuiSnackbar: {
      styleOverrides: {
        root: {},
      },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          background: "#FFFFFF",
          justifyContent: "center",
          color: "#475467",
          fontSize: "1rem",
          borderRadius: "1rem",
          border: "1px solid #CFDAE9",
          boxShadow:
            "0px 1.25rem 1.5rem -0.25px rgba(16, 24, 40, 0.1), 0px 0.5rem 0.5rem -0.25rem rgba(16, 24, 40, 0.04)",
        },
      },
    },
  },
});

const initialFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
};
export const useFormControls = () => {
  const [values, setValues] = useState(initialFormValues);
  const [errors, setErrors] = useState({});

  const validate = (fieldValues = values) => {
    const temp = { ...errors };

    if ("firstName" in fieldValues) {
      temp.firstName = fieldValues.firstName ? "" : "This field is required.";
    }

    if ("lastName" in fieldValues) {
      temp.lastName = fieldValues.lastName ? "" : "This field is required.";
    }

    if ("password" in fieldValues) {
      temp.password = fieldValues.password ? "" : "This field is required.";
    }

    if ("password" in fieldValues) {
      temp.password = fieldValues.password ? "" : "This field is required.";
      if (fieldValues.password) {
        temp.email =
          /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(
            fieldValues.password,
          )
            ? ""
            : "Set password with min 8 letter password, least a symbol, an upper, a lower case letters and a number";
      }
    }
    if ("email" in fieldValues) {
      temp.email = fieldValues.email ? "" : "This field is required.";
      if (fieldValues.email) {
        temp.email = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fieldValues.email)
          ? ""
          : "Email is not valid.";
      }
    }

    setErrors({
      ...temp,
    });
  };

  const handleInputValue = (e) => {
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]: value,
    });
    validate({ [name]: value });
  };

  const formIsValid = (fieldValues = values) => {
    const isValid =
      fieldValues.firstName &&
      fieldValues.lastName &&
      fieldValues.email &&
      fieldValues.password &&
      Object.values(errors).every((x) => x === "");

    return isValid;
  };

  return {
    handleInputValue,
    formIsValid,
    errors,
    values,
  };
};

// Register function
export default function Register() {
  const navigate = useNavigate();
  const navigateTo = (location) => {
    navigate(location);
  };

  const { handleInputValue, formIsValid, errors, values } = useFormControls();

  const { account, setAccount } = useContext(AccountContext);

  const [snackBarState, setSnackBarState] = React.useState({
    open: false,
    message: "Everything's Good",
  });

  const { open, message } = snackBarState;

  const handleClose = () => {
    setSnackBarState({ open: false });
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    console.log("handleFormSubmit called!");
    if (formIsValid(values)) {
      console.log(values);
      const res = await postRegisterForm(values);

      if (res) {
        console.log(res);
        setSnackBarState({ open: true, message: res });
        const temp = {
          id: "",
          email: values.email,
          firstName: values.firstName,
        };
        console.log(temp);
        setAccount(temp);
        navigateTo("/");
        console.log(account);
      } else {
        console.log("postRegisterForm did not return val");
      }
    }
  };

  return (
    // <ThemeProvider theme={theme}>
    <Container sx={{ ml: 8, mb: "19vh" }} component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5">
          Register
        </Typography>
        <Box
          component="form"
          noValidate
          onSubmit={handleFormSubmit}
          sx={{ mt: 3 }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                autoComplete="given-name"
                name="firstName"
                onBlur={handleInputValue}
                onChange={handleInputValue}
                required
                fullWidth
                id="firstName"
                label="First Name"
                {...(errors.firstName && {
                  error: true,
                  helperText: errors.firstName,
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                onBlur={handleInputValue}
                onChange={handleInputValue}
                fullWidth
                id="lastName"
                label="Last Name"
                name="lastName"
                autoComplete="family-name"
                {...(errors.lastName && {
                  error: true,
                  helperText: errors.lastName,
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                onBlur={handleInputValue}
                onChange={handleInputValue}
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                {...(errors.email && {
                  error: true,
                  helperText: errors.email,
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                onBlur={handleInputValue}
                onChange={handleInputValue}
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="new-password"
                {...(errors.password && {
                  error: true,
                  helperText: errors.password,
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Checkbox defaultChecked color="success" />}
                label="Keep Me Signed In"
              />
            </Grid>
          </Grid>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              width: "200px",
              mt: 3,
              mb: 2,
              backgroundColor: "black",
            }}
          >
            Create Account
          </Button>
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link href="#/login" variant="body2">
                Already have an account? Sign in
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
      <Copyright sx={{ mt: 5 }} />
      <ThemeProvider theme={theme}>
        <Snackbar
          sx={{ bottom: { xs: "48px", sm: "98px" } }}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          open={open}
          autoHideDuration={2000}
          onClose={handleClose}
          message={message}
        />
      </ThemeProvider>
    </Container>
    // </ThemeProvider>
  );
}
