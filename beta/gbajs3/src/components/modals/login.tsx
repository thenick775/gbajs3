import { TextField, Button } from '@mui/material';
import { useContext, useEffect, useId } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { BiError } from 'react-icons/bi';
import { PacmanLoader } from 'react-spinners';
import { styled, useTheme } from 'styled-components';

import { ModalBody } from './modal-body.tsx';
import { ModalFooter } from './modal-footer.tsx';
import { ModalHeader } from './modal-header.tsx';
import { AuthContext } from '../../context/auth/auth.tsx';
import { ModalContext } from '../../context/modal/modal.tsx';
import { useLogin } from '../../hooks/use-login.tsx';
import {
  EmbeddedProductTour,
  type TourSteps
} from '../product-tour/embedded-product-tour.tsx';

type InputProps = {
  username: string;
  password: string;
};

type FormErrorProps = {
  icon?: JSX.Element;
  text: string;
};

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100dvw;
  max-width: fill-available;
  max-width: stretch;
  max-width: -webkit-fill-available;
  max-width: -moz-available;
`;

const ErrorWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const ErrorText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.errorRed};
`;

const FormError = ({ icon, text }: FormErrorProps) => {
  return (
    <ErrorWrapper>
      {icon}
      <ErrorText>{text}</ErrorText>
    </ErrorWrapper>
  );
};

export const LoginModal = () => {
  const theme = useTheme();
  const { setIsModalOpen } = useContext(ModalContext);
  const { setAccessToken, setAccessTokenSource } = useContext(AuthContext);
  const loginFormId = useId();
  const {
    execute: executeLogin,
    data: accessToken,
    isLoading: loginLoading,
    error: loginError
  } = useLogin();

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors }
  } = useForm<InputProps>();

  useEffect(() => {
    if (!loginLoading && !loginError && accessToken) {
      setAccessToken(accessToken);
      setAccessTokenSource('login');
      setIsModalOpen(false);
    }
  }, [
    accessToken,
    loginLoading,
    loginError,
    setAccessToken,
    setAccessTokenSource,
    setIsModalOpen
  ]);

  const onSubmit: SubmitHandler<InputProps> = async (formData) => {
    await executeLogin(formData);
    reset();
  };

  const tourSteps: TourSteps = [
    {
      content: (
        <p>
          Use this form to login for premium features if you have a registered
          account.
        </p>
      ),
      locale: { skip: <strong aria-label="Skip">Skip</strong> },
      placement: 'auto',
      placementBeacon: 'right-end',
      spotlightPadding: 10,
      target: `#${CSS.escape(loginFormId)}`
    }
  ];

  return (
    <>
      <ModalHeader title="Login" />
      <ModalBody>
        {loginLoading ? (
          <PacmanLoader
            color={theme.gbaThemeBlue}
            cssOverride={{ margin: '0 auto' }}
          />
        ) : (
          <StyledForm id={loginFormId} onSubmit={handleSubmit(onSubmit)}>
            <TextField
              error={!!errors?.username}
              label="Username"
              autoComplete="username"
              variant="filled"
              helperText={errors?.username?.message}
              {...register('username', {
                required: { value: true, message: 'Username is required' }
              })}
            />

            <TextField
              error={!!errors?.password}
              label="Password"
              type="password"
              autoComplete="current-password"
              variant="filled"
              helperText={errors?.password?.message}
              {...register('password', {
                required: { value: true, message: 'Password is required' }
              })}
            />
            {!!loginError && (
              <FormError
                icon={<BiError style={{ color: theme.errorRed }} />}
                text="Login has failed"
              />
            )}
          </StyledForm>
        )}
      </ModalBody>
      <ModalFooter>
        <Button form={loginFormId} type="submit" variant="contained">
          Login
        </Button>
        <Button variant="outlined" onClick={() => setIsModalOpen(false)}>
          Close
        </Button>
      </ModalFooter>
      <EmbeddedProductTour
        steps={tourSteps}
        completedProductTourStepName="hasCompletedLoginTour"
      />
    </>
  );
};
