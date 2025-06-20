import React from 'react';

export default function DeleteAccountInfoPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Delete Your Account</h1>
      <p className="mb-4">
        We’re sorry to see you go. If you wish to delete your account, please follow the steps below:
      </p>
      <ol className="list-decimal list-inside mb-4">
        <li>Log in to your account.</li>
        <li>Go to your profile page.</li>
        <li>Then click on <strong>settings</strong> button</li>
        <li>Look for the <strong>Delete Account</strong> option.</li>
        <li>Conform the deletion</li>
      </ol>
      <p className="mb-4">
        <strong>Important:</strong> Deleting your account is permanent and cannot be undone. All your data, including your profile, posts, and settings, will be permanently removed.
      </p>
      <p className="mb-4">
        If you need assistance or have questions, please contact our support team at <a href="mailto:support@pickcreator.com" className="text-blue-600 underline">support@pickcreator.com</a>.
      </p>
    </div>
  );
}
