const fs = require('fs');

const rawHtml = fs.readFileSync('d:/ChuyenNganh/CN9/DOAN/SourceCode/frontend/src/pages/RegisterStitchRaw.html', 'utf8');

let bodyContent = rawHtml.substring(rawHtml.indexOf('<body'), rawHtml.lastIndexOf('</body>'));
bodyContent = bodyContent.substring(bodyContent.indexOf('>') + 1);

let jsx = bodyContent
  .replace(/class=/g, 'className=')
  .replace(/for=/g, 'htmlFor=')
  .replace(/<br>/g, '<br/>')
  .replace(/<hr>/g, '<hr/>')
  .replace(/<img(.*?)>/g, (match, p1) => {
    if (p1.endsWith('/')) return match;
    return '<img' + p1 + ' />';
  })
  .replace(/<input(.*?)>/g, (match, p1) => {
    if (p1.endsWith('/')) return match;
    return '<input' + p1 + ' />';
  })
  .replace(/<!--(.*?)-->/g, '{/* $1 */}');

const componentCode = `import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    // Temporary redirect to login
    navigate('/login');
  };

  return (
    <div className="bg-background-light text-slate-900 font-display min-h-screen">
      ${jsx}
    </div>
  );
};

export default Register;
`;

fs.writeFileSync('d:/ChuyenNganh/CN9/DOAN/SourceCode/frontend/src/features/auth/Register.jsx', componentCode);
console.log('Register JSX Component created');
