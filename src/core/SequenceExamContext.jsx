import React, { useContext } from 'react';

const SequenceExamContext = React.createContext({});

export const useSequenceExam = () => useContext(SequenceExamContext);

export default SequenceExamContext;
