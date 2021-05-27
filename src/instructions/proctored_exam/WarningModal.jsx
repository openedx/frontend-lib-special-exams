import React from 'react';
import PropTypes from 'prop-types';
import { Button, Modal } from '@edx/paragon';

const WarningModal = ({
  isOpen, handleClose, title, body,
}) => (
  <Modal
    title={title}
    open={isOpen}
    onClose={() => {}}
    renderDefaultCloseButton={false}
    renderHeaderCloseButton={false}
    buttons={[
      <Button variant="tertiary" onClick={handleClose}>Ok</Button>,
    ]}
    body={(
      <p>
        {body}
      </p>
    )}
  />
);

WarningModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  body: PropTypes.string.isRequired,
};

export default WarningModal;
