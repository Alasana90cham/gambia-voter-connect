
import React from 'react';
import MultiStepForm from '@/components/form/MultiStepForm';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-gray-800">NATIONAL YOUTH PARLIAMENT GAMBIA</h1>
            <h2 className="text-2xl font-semibold mb-2 text-gray-700">Voter Registration</h2>
            <p className="text-gray-600">Complete the form below to register as a voter</p>
          </div>
          
          <MultiStepForm />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
