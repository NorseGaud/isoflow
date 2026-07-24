import React, { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField
} from '@mui/material';

type Props = {
  open: boolean;
  title: string;
  label: string;
  confirmLabel?: string;
  initialValue?: string;
  onClose: () => void;
  onConfirm: (name: string) => void;
};

export const NameDialog = ({
  open,
  title,
  label,
  confirmLabel = 'Create',
  initialValue = '',
  onClose,
  onConfirm
}: Props) => {
  const [name, setName] = useState(initialValue);

  useEffect(() => {
    if (open) {
      setName(initialValue);
    }
  }, [open, initialValue]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          margin="dense"
          label={label}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && name.trim()) {
              onConfirm(name.trim());
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!name.trim()}
          onClick={() => {
            onConfirm(name.trim());
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
