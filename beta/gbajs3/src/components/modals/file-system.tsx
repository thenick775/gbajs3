import TreeItem, { TreeItemProps, treeItemClasses } from '@mui/lab/TreeItem';
import TreeView from '@mui/lab/TreeView';
import { Button } from '@mui/material';
import { alpha, styled } from '@mui/material/styles';
import { useContext } from 'react';

import { ModalBody } from './modal-body.tsx';
import { ModalFooter } from './modal-footer.tsx';
import { ModalHeader } from './modal-header.tsx';
import { EmulatorContext } from '../../context/emulator/emulator.tsx';
import { ModalContext } from '../../context/modal/modal.tsx';
import {
  CloseSquare,
  PlusSquare,
  MinusSquare
} from '../shared/action-box-icons.tsx';
import { FileNode } from '../../emulator/mgba/mgba-emulator.tsx';

const StyledTreeItem = styled((props: TreeItemProps) => (
  <TreeItem {...props} />
))(({ theme }) => ({
  // note: using mui theme here
  [`& .${treeItemClasses.iconContainer}`]: {
    '& .close': {
      opacity: 0.3
    }
  },
  [`& .${treeItemClasses.group}`]: {
    marginLeft: 15,
    paddingLeft: 18,
    borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.4)}`
  }
}));

const CustomizedTreeView = ({ allFiles }: { allFiles?: FileNode }) => {
  if (!allFiles) return null;

  let counter = 0;

  const renderTree = (node: FileNode) => {
    counter = counter + 1;
    let nodeName = node.path.split('/')?.pop();

    return (
      <StyledTreeItem
        key={`${node.path}_idx_${counter}`}
        nodeId={`${counter}`}
        label={nodeName}
      >
        {node.isDir && !!node.children
          ? node.children.map((node) => {
              return renderTree(node);
            })
          : null}
      </StyledTreeItem>
    );
  };

  return (
    <TreeView
      aria-label="FileSystem"
      defaultExpanded={['1']}
      defaultCollapseIcon={<MinusSquare />}
      defaultExpandIcon={<PlusSquare />}
      defaultEndIcon={<CloseSquare />}
      sx={{ minHeight: 264, flexGrow: 1, overflow: 'hidden' }}
    >
      {renderTree(allFiles)}
    </TreeView>
  );
};

export const FileSystemModal = () => {
  const { setIsModalOpen } = useContext(ModalContext);
  const { emulator } = useContext(EmulatorContext);

  const allFiles = emulator?.listAllFiles();

  return (
    <>
      <ModalHeader title="File System" />
      <ModalBody>
        <CustomizedTreeView allFiles={allFiles} />
      </ModalBody>
      <ModalFooter>
        <Button variant="contained" onClick={emulator?.fsSync}>
          Save File System
        </Button>
        <Button variant="outlined" onClick={() => setIsModalOpen(false)}>
          Close
        </Button>
      </ModalFooter>
    </>
  );
};
