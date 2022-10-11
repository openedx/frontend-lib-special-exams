import React from 'react';
import PropTypes from 'prop-types';
import { ActionRow, ModalDialog } from '@edx/paragon';

const WarningModal = ({
  isOpen, handleClose, title, body,
}) => (
  <ModalDialog
    isOpen={isOpen}
    onClose={() => { }}
    hasCloseButton={false}
  >

    <ModalDialog.Header>
      <ModalDialog.Title>
        {title}
      </ModalDialog.Title>
    </ModalDialog.Header>
    <ModalDialog.body>
      {body}
    </ModalDialog.body>
    <ModalDialog.Footer>
      <ActionRow>
        <ModalDialog.CloseButton onClick={handleClose} variant="tertiary">
          Ok
        </ModalDialog.CloseButton>
      </ActionRow>
    </ModalDialog.Footer>
  </ModalDialog>
);

WarningModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  body: PropTypes.string.isRequired,
};

export default WarningModal;
