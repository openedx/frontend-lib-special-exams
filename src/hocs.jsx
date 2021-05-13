import React from 'react';
import { connect } from 'react-redux';
import { getDisplayName } from './helpers';
import { store as examStore } from './data';

// eslint-disable-next-line import/prefer-default-export
export const withExamStore = (WrappedComponent, mapStateToProps = null, dispatchActions = null) => {
  const ConnectedComp = connect(mapStateToProps, dispatchActions)(WrappedComponent);
  const retValue = (props) => <ConnectedComp store={examStore} {...props} />;
  retValue.displayName = `WithExamStore(${getDisplayName(WrappedComponent)})`;
  return retValue;
};
