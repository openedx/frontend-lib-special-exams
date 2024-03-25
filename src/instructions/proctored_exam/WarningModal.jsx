import React from 'react';
import PropTypes from 'prop-types';
import { ActionRow, ModalDialog, Button } from '@openedx/paragon';

const WarningModal = ({
  isOpen, handleClose, title, body,
}) => (
  <ModalDialog
    isOpen={isOpen}
    hasCloseButton={false}
  >

    <ModalDialog.Header>
      <ModalDialog.Title>
        {title}
      </ModalDialog.Title>
    </ModalDialog.Header>
    <ModalDialog.Body>
      {body}
    </ModalDialog.Body>
    <ModalDialog.Footer>
      <ActionRow>
        <Button onClick={handleClose} variant="tertiary">
          Ok
        </Button>
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
