import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

const TestPrint = () => {
  const ref = useRef(null);
  const handlePrint = useReactToPrint({ content: () => ref.current });

  return (
    <div>
      <div ref={ref}>Test Print</div>
      <button onClick={handlePrint}>Print Test</button>
    </div>
  );
};

export default TestPrint;