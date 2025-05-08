
import React from 'react';
import { CheckCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoterFormData } from '@/types/form';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';

interface CompleteStepProps {
  formData: VoterFormData;
  onReset: () => void;
}

const CompleteStep: React.FC<CompleteStepProps> = ({ formData, onReset }) => {
  // Generate voter profile text for QR code and download
  const generateProfileText = () => {
    const maskedID = formData.identificationNumber
      ? `${formData.identificationNumber.substring(0, 2)}****${formData.identificationNumber.slice(-2)}`
      : 'Not provided';

    return `
NATIONAL YOUTH PARLIAMENT GAMBIA - VOTER REGISTRATION PROFILE
-----------------------------------------------------
Full Name: ${formData.fullName}
Date of Birth: ${formData.dateOfBirth ? format(formData.dateOfBirth, 'MMMM d, yyyy') : 'Not provided'}
Gender: ${formData.gender ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1) : 'Not provided'}
Organization: ${formData.organization}
Region: ${formData.region}
Constituency: ${formData.constituency}
ID Number: ${maskedID}
-----------------------------------------------------
IMPORTANT: Please bring this document and your ID on election day.
    `;
  };

  const handleDownloadProfile = () => {
    const profileContent = generateProfileText();
    const blob = new Blob([profileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const safeName = formData.fullName
      .replace(/[^\w\s]/gi, '') // Remove non-word characters
      .replace(/\s+/g, '_');    // Replace spaces with underscores

    const link = document.createElement('a');
    link.href = url;
    link.download = `NYPG_Voter_Profile_${safeName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const maskedID = formData.identificationNumber
    ? `${formData.identificationNumber.substring(0, 2)}****${formData.identificationNumber.slice(-2)}`
    : 'Not provided';

  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Complete</h2>
      <p className="text-gray-600 mb-6">
        Thank you for registering as a voter. Your information has been successfully submitted.
      </p>

      <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 mb-6">
        <p className="text-amber-800 font-medium">
          Important Reminder: On election day, please bring the same identification document you used for this registration.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 text-left mb-6">
        <h3 className="font-semibold text-lg mb-3 text-gray-800">Registration Summary</h3>
        <div className="space-y-2">
          <div><span className="font-medium">Name:</span> {formData.fullName}</div>
          <div><span className="font-medium">Date of Birth:</span> {formData.dateOfBirth ? format(formData.dateOfBirth, 'PPP') : 'Not provided'}</div>
          <div><span className="font-medium">Gender:</span> {formData.gender ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1) : 'Not provided'}</div>
          <div><span className="font-medium">Organization:</span> {formData.organization}</div>
          <div><span className="font-medium">Region:</span> {formData.region}</div>
          <div><span className="font-medium">Constituency:</span> {formData.constituency}</div>
          <div><span className="font-medium">ID Number:</span> {maskedID}</div>
        </div>
      </div>

      <div className="mx-auto mb-6 flex flex-col items-center">
        <h3 className="font-semibold text-lg mb-3 text-gray-800">Your Voter QR Code</h3>
        <p className="text-sm text-gray-600 mb-3">
          Scan this code at the polling station for quick verification
        </p>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <QRCodeSVG 
            value={generateProfileText()}
            size={200}
            level="H"
            includeMargin={true}
            className="mx-auto"
          />
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleDownloadProfile}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90"
          aria-label="Download your registration profile"
        >
          <Download size={18} />
          Download Your Profile
        </Button>
      </div>
    </div>
  );
};

export default CompleteStep;
