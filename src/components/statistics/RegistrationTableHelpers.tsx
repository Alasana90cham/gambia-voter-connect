
import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

interface VoterData {
  id: string;
  full_name: string;
  email: string;
  organization: string;
  date_of_birth: string;
  gender: string;
  region: string;
  constituency: string;
  identification_type: string;
  identification_number: string;
}

export const NoDataRow = () => (
  <TableRow>
    <TableCell colSpan={9} className="text-center py-4">
      No matching records found
    </TableCell>
  </TableRow>
);

interface VoterRowProps {
  voter: VoterData;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

export const VoterRow: React.FC<VoterRowProps> = ({ voter, isSelected, onToggleSelect }) => {
  return (
    <TableRow>
      <TableCell>
        <Checkbox 
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(voter.id)}
          aria-label={`Select ${voter.full_name}`}
        />
      </TableCell>
      <TableCell>{voter.full_name}</TableCell>
      <TableCell>{voter.organization}</TableCell>
      <TableCell>{voter.date_of_birth ? voter.date_of_birth.split('T')[0] : ''}</TableCell>
      <TableCell className="capitalize">{voter.gender || ''}</TableCell>
      <TableCell>{voter.region || ''}</TableCell>
      <TableCell>{voter.constituency || ''}</TableCell>
      <TableCell>
        {voter.identification_type === 'birth_certificate' ? 'Birth Certificate' : 
         voter.identification_type === 'identification_document' ? 'ID Document' :
         voter.identification_type === 'passport_number' ? 'Passport' : ''}
      </TableCell>
      <TableCell>{voter.identification_number}</TableCell>
    </TableRow>
  );
};

export const formatForExport = (voter: VoterData) => {
  const dob = voter.date_of_birth ? voter.date_of_birth.split('T')[0] : '';
  const idType = voter.identification_type === 'birth_certificate' ? 'Birth Certificate' : 
                voter.identification_type === 'identification_document' ? 'ID Document' :
                voter.identification_type === 'passport_number' ? 'Passport' : '';
  
  return `"${voter.full_name || ''}","${voter.email || ''}","${voter.organization || ''}","${dob}","${voter.gender || ''}","${voter.region || ''}","${voter.constituency || ''}","${idType}","${voter.identification_number || ''}"`;
};
