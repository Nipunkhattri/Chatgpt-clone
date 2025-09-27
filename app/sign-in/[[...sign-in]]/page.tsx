import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-gray-400">Sign in to continue to ChatGPT Clone</p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: 
                'bg-blue-600 hover:bg-blue-700 text-sm normal-case',
              card: 'bg-gray-800 border border-gray-700',
              headerTitle: 'text-white',
              headerSubtitle: 'text-gray-400',
              socialButtonsIconButton: 
                'border-gray-600 hover:bg-gray-700',
              formFieldInput: 
                'bg-gray-700 border-gray-600 text-white',
              formFieldLabel: 'text-gray-300',
              footerActionLink: 'text-blue-400 hover:text-blue-300',
              formFieldHintText: 'text-gray-400',
              dividerLine: 'bg-gray-600',
              dividerText: 'text-gray-400',
            },
          }}
        />
      </div>
    </div>
  );
}