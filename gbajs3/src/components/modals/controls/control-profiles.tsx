import { IconButton, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useLocalStorage } from '@uidotdev/usehooks';
import { nanoid } from 'nanoid';
import { useState } from 'react';
import { BiTrash, BiEdit, BiSave } from 'react-icons/bi';

import {
  useInitialBoundsContext,
  useLayoutContext
} from '../../../hooks/context.tsx';
import { virtualControlProfilesLocalStorageKey } from '../../controls/consts.tsx';
import { CenteredText, StyledBiPlus } from '../../shared/styled.tsx';

import type { Layouts } from '../../../context/layout/layout-context.tsx';
import type { IconButtonProps } from '@mui/material';
import type { ReactNode } from 'react';

type ControlProfilesProps = {
  id: string;
};

type VirtualControlProfile = {
  id: string;
  name: string;
  active: boolean;
  layouts: Layouts;
};

type VirtualControlProfiles = VirtualControlProfile[];

type StatefulIconButtonProps = {
  condition: boolean;
  truthyIcon: ReactNode;
  falsyIcon: ReactNode;
} & IconButtonProps;

type EditableProfileLoadButtonProps = {
  name: string;
  loadProfile: () => void;
  onSubmit: (name: string) => void;
};

const StyledLi = styled('li')`
  margin: 0;
`;

const ProfilesList = styled('ul')`
  list-style: none;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;

  background: ${({ theme }) => theme.modalSurfaceElevated};
  border: 1px solid ${({ theme }) => theme.modalListBorder};
  border-radius: 10px;
  overflow: hidden;

  & > ${StyledLi} + ${StyledLi} {
    border-top: 1px solid ${({ theme }) => theme.modalListBorder};
  }
`;

const RowGrid = styled('div')`
  display: grid;
  grid-template-columns: 1fr 36px;
  align-items: center;
`;

const StyledBiTrash = styled(BiTrash)`
  height: 100%;
  width: 20px;
`;

const StyledBiEdit = styled(BiEdit)`
  height: 100%;
  width: 20px;
`;

const StyledBiSave = styled(BiSave)`
  height: 100%;
  width: 20px;
`;

const LoadProfileButton = styled('button')`
  width: 100%;
  padding: 0.875rem 1rem;
  color: ${({ theme }) => theme.modalTextPrimary};
  background: transparent;
  border: 0;
  text-align: left;
  font: inherit;
  line-height: 1.35;
  overflow: hidden;
  transition:
    background-color 120ms ease,
    box-shadow 120ms ease;

  &:hover {
    background-color: ${({ theme }) => theme.modalListItemHoverSurface};
  }

  &:focus-visible {
    outline: none;
    position: relative;
    z-index: 1;
    background-color: ${({ theme }) => theme.modalListItemHoverSurface};
    box-shadow:
      inset 0 0 0 1px ${({ theme }) => theme.gbaThemeBlue},
      0 0 0 2px ${({ theme }) => theme.focusRingPrimarySoft};
  }

  &:active {
    background-color: ${({ theme }) => theme.modalListItemHoverSurface};
  }
`;

const FlexContainer = styled('div')`
  display: flex;
  gap: 0;
  min-width: 0;
  align-items: center;
`;

const EditField = styled(TextField)`
  width: 100%;

  & .MuiInputBase-root {
    color: ${({ theme }) => theme.modalTextPrimary};
  }

  & .MuiInputBase-input {
    padding: 0.875rem 1rem;
  }
`;

const EmptyState = styled(CenteredText)`
  padding: 1rem;
  color: ${({ theme }) => theme.modalTextSecondary};
`;

const StatefulIconButton = ({
  condition,
  truthyIcon,
  falsyIcon,
  ...rest
}: StatefulIconButtonProps) => (
  <IconButton {...rest}>{condition ? truthyIcon : falsyIcon}</IconButton>
);

const EditableProfileLoadButton = ({
  name,
  loadProfile,
  onSubmit
}: EditableProfileLoadButtonProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [storedName, setStoredName] = useState(name);

  const submitNameChange = (name?: string) => {
    if (isEditing && name) onSubmit(name);

    setIsEditing((prevState) => !prevState);
  };

  return (
    <FlexContainer>
      {isEditing ? (
        <EditField
          variant="standard"
          error={!storedName}
          value={storedName}
          onChange={(e) => {
            setStoredName(e.target.value);
          }}
        />
      ) : (
        <LoadProfileButton onClick={loadProfile} title={name}>
          {name}
        </LoadProfileButton>
      )}
      <StatefulIconButton
        condition={isEditing}
        truthyIcon={<StyledBiSave />}
        falsyIcon={<StyledBiEdit />}
        aria-label={`${isEditing ? 'Save' : 'Edit'} ${name}'s name`}
        type="submit"
        onClick={() => {
          submitNameChange(storedName);
        }}
      />
    </FlexContainer>
  );
};

export const ControlProfiles = ({ id }: ControlProfilesProps) => {
  const [virtualControlProfiles, setVirtualControlProfiles] = useLocalStorage<
    VirtualControlProfiles | undefined
  >(virtualControlProfilesLocalStorageKey);
  const { layouts, setLayouts } = useLayoutContext();
  const { clearInitialBounds } = useInitialBoundsContext();

  const addProfile = () => {
    setVirtualControlProfiles((prevState) => [
      ...(prevState ?? []),
      {
        id: nanoid(),
        name: `Profile-${(prevState?.length ?? 0) + 1}`,
        layouts: layouts,
        active: true
      }
    ]);
  };

  const loadProfile = (layouts: Layouts) => {
    setLayouts(layouts);
    clearInitialBounds();
  };

  const updateProfile = (id: string, updatedName: string) => {
    setVirtualControlProfiles((prevState) =>
      prevState?.map((profile) => {
        if (profile.id === id)
          return {
            ...profile,
            name: updatedName
          };

        return profile;
      })
    );
  };

  const deleteProfile = (id: string) => {
    setVirtualControlProfiles((prevState) =>
      prevState?.filter((p) => p.id !== id)
    );
  };

  return (
    <>
      <ProfilesList id={id} aria-label="Profiles List">
        {virtualControlProfiles?.map(
          (profile: VirtualControlProfile, idx: number) => (
            <StyledLi key={`${profile.name}_${idx}_action_list_item`}>
              <RowGrid>
                <EditableProfileLoadButton
                  name={profile.name}
                  loadProfile={() => {
                    loadProfile(profile.layouts);
                  }}
                  onSubmit={(name) => {
                    updateProfile(profile.id, name);
                  }}
                />
                <IconButton
                  aria-label={`Delete ${profile.name}`}
                  onClick={() => {
                    deleteProfile(profile.id);
                  }}
                >
                  <StyledBiTrash />
                </IconButton>
              </RowGrid>
            </StyledLi>
          )
        )}
        {!virtualControlProfiles?.length && (
          <StyledLi>
            <EmptyState>No control profiles</EmptyState>
          </StyledLi>
        )}
      </ProfilesList>
      <IconButton
        aria-label="Create New Profile"
        sx={{ padding: 0 }}
        onClick={() => {
          addProfile();
        }}
      >
        <StyledBiPlus />
      </IconButton>
    </>
  );
};
