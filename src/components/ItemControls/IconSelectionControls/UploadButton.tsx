import React, { useCallback, useRef } from 'react';
import { Button } from '@mui/material';
import { UploadOutlined as UploadIcon } from '@mui/icons-material';
import { ICON_UPLOAD_ACCEPT, useIconUpload } from 'src/hooks/useIconUpload';

export const UploadButton = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { uploadIcons } = useIconUpload();

  const onUploadClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const onFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = event.target;

      if (!files?.length) return;

      await uploadIcons(files);
      event.target.value = '';
    },
    [uploadIcons]
  );

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ICON_UPLOAD_ACCEPT}
        multiple
        hidden
        onChange={onFileChange}
      />
      <Button
        variant="outlined"
        fullWidth
        startIcon={<UploadIcon />}
        onClick={onUploadClick}
      >
        Upload icons
      </Button>
    </>
  );
};
