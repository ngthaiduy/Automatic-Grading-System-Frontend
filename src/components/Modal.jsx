import React from 'react';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
      // onClick={onClose}
    >
      <div className="bg-slate-50 rounded-md w-fit max-w-[90vw] p-5 flex flex-col gap-4 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
        {children}
      </div>
    </div>
  );
};

export default Modal;
