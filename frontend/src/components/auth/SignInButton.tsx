// frontend/src/components/auth/SignInButton.tsx
// Renders the Google-branded sign-in button via @react-oauth/google GoogleLogin component.
// GoogleLogin.onSuccess receives credentialResponse.credential = ID token (correct for verifyIdToken).
// Do NOT use useGoogleLogin with flow='implicit' — that returns access token, not ID token.
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';

export function SignInButton() {
  const { signIn } = useAuth();

  return (
    <GoogleLogin
      onSuccess={(credentialResponse) => {
        if (credentialResponse.credential) {
          signIn(credentialResponse.credential);
        }
      }}
      onError={() => console.error('[SignInButton] Google sign-in failed. Check VITE_GOOGLE_CLIENT_ID and browser console for details.')}
      theme="filled_black"
      shape="rectangular"
      text="signin_with"
    />
  );
}
