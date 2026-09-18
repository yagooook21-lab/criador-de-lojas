import React from 'react';

const StoreLoader = () => (
  <div style={{
    position: 'fixed',
    inset: 0,
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff159',
  }}>
    <div style={{
      width: 48, height: 48,
      border: '4px solid transparent',
      borderTop: '4px solid #3483fa',
      borderRadius: '50%',
      animation: 'store-loader-spin 0.8s linear infinite',
    }} />
    <style>{`@keyframes store-loader-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

export default StoreLoader;
