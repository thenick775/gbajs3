import { Collapse, IconButton, TextField } from '@mui/material';
import { useLocalStorage } from '@uidotdev/usehooks';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  BiPlus,
  BiTrash,
  BiShow,
  BiHide,
  BiEdit,
  BiSave
} from 'react-icons/bi';
import { styled } from 'styled-components';

import { useLayoutContext } from '../../../hooks/context.tsx';
import { virtualControlProfilesLocalStorageKey } from '../../controls/consts.tsx';
import { CenteredText } from '../../shared/styled.tsx';

import type { Layouts } from '../../../hooks/use-layouts.tsx';
import type { IconButtonProps } from '@mui/material';
import type { ReactNode } from 'react';

type ControlProfilesProps = {
  id: string;
};

type VirtualControlProfile = {
  name: string;
  active: boolean;
  layouts: Layouts;
};

type VirtualControlProfiles = VirtualControlProfile[];

const StyledBiPlus = styled(BiPlus)`
  width: 25px;
  height: 25px;
`;

const StyledLi = styled.li`
  cursor: pointer;
  display: grid;
  grid-template-columns: auto repeat(2, 32px);
  gap: 10px;

  color: ${({ theme }) => theme.blueCharcoal};
  background-color: ${({ theme }) => theme.pureWhite};
  border: 1px solid rgba(0, 0, 0, 0.125);
`;

const ProfilesList = styled.ul`
  list-style-type: none;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;

  & > ${StyledLi}:first-child {
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
  }

  & > ${StyledLi}:last-child {
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
  }

  & > ${StyledLi}:not(:first-child) {
    border-top-width: 0;
  }
`;

const StyledCiCircleRemove = styled(BiTrash)`
  height: 100%;
  width: 20px;
`;

const StyledBiShow = styled(BiShow)`
  height: 100%;
  width: 20px;
`;

const StyledBiHide = styled(BiHide)`
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

const LoadProfileButton = styled.button`
  padding: 0.5rem 0.5rem;
  width: 100%;
  color: ${({ theme }) => theme.blueCharcoal};
  background-color: ${({ theme }) => theme.pureWhite};
  border: none;
  text-align: left;

  &:hover {
    color: ${({ theme }) => theme.darkGrayBlue};
    background-color: ${({ theme }) => theme.aliceBlue1};
  }
`;

const StyledForm = styled.form`
  display: flex;
`;

const StatefulIconButton = ({
  condition,
  truthyIcon,
  falsyIcon,
  ...rest
}: {
  condition: boolean;
  truthyIcon: ReactNode;
  falsyIcon: ReactNode;
} & IconButtonProps) => (
  <IconButton sx={{ padding: 0 }} {...rest}>
    {condition ? truthyIcon : falsyIcon}
  </IconButton>
);

const EditableProfileLoadButton = ({
  name,
  onProfileLoad,
  onSubmit
}: {
  name: string;
  onProfileLoad: () => void;
  onSubmit: ({ name }: { name: string }) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const { register, handleSubmit } = useForm<{ name: string }>({
    defaultValues: {
      name: name
    }
  });

  return (
    <StyledForm onSubmit={handleSubmit(onSubmit)}>
      {isEditing ? (
        <TextField
          variant="standard"
          sx={{
            width: '100%',
            '& .MuiInputBase-input': {
              fontSize: 13,
              height: 16,
              padding: 1
            }
          }}
          {...register('name', { required: true })}
        />
      ) : (
        <LoadProfileButton onClick={onProfileLoad}>{name}</LoadProfileButton>
      )}
      <StatefulIconButton
        condition={isEditing}
        truthyIcon={<StyledBiSave />}
        falsyIcon={<StyledBiEdit />}
        aria-label={`${isEditing ? 'Save' : 'Edit'} Profile Name`}
        type="submit"
        onClick={() => setIsEditing((prevState) => !prevState)}
      />
    </StyledForm>
  );
};

export const ControlProfiles = ({ id }: ControlProfilesProps) => {
  const [virtualControlProfiles, setVirtualControlProfiles] = useLocalStorage<
    VirtualControlProfiles | undefined
  >(virtualControlProfilesLocalStorageKey);
  const { layouts, setLayouts } = useLayoutContext();
  const [shownProfile, setShownProfile] = useState<string | undefined>();

  const addProfile = () => {
    setVirtualControlProfiles((prevState) => [
      ...(prevState ?? []),
      {
        name: `Profile-${prevState?.length ?? 0}`,
        layouts: layouts,
        active: true
      }
    ]);
  };

  const updateProfile = (name: string, updatedName: string) => {
    setVirtualControlProfiles((prevState) =>
      prevState?.map((profile) => {
        if (profile.name == name)
          return {
            ...profile,
            name: updatedName
          };

        return profile;
      })
    );
  };

  const deleteProfile = (name: string) => {
    setVirtualControlProfiles((prevState) =>
      prevState?.filter((p) => p.name !== name)
    );
  };

  return (
    <>
      <ProfilesList id={id}>
        {virtualControlProfiles?.map?.(
          (profile: VirtualControlProfile, idx: number) => (
            <>
              <StyledLi key={`${profile.name}_${idx}_action_list_item`}>
                <EditableProfileLoadButton
                  name={profile.name}
                  onProfileLoad={() => setLayouts(profile.layouts)}
                  onSubmit={({ name }) => updateProfile(profile.name, name)}
                />
                <StatefulIconButton
                  condition={shownProfile == profile.name}
                  aria-label={`Show ${profile.name}`}
                  truthyIcon={<StyledBiHide />}
                  falsyIcon={<StyledBiShow />}
                  onClick={() =>
                    setShownProfile(
                      profile.name === shownProfile ? undefined : profile.name
                    )
                  }
                />
                <IconButton
                  aria-label={`Delete ${profile.name}`}
                  sx={{ padding: 0 }}
                  onClick={() => deleteProfile(profile.name)}
                >
                  <StyledCiCircleRemove />
                </IconButton>
              </StyledLi>
              <Collapse
                key={`${profile.name}_${idx}_details`}
                sx={{
                  border: '1px solid rgba(0, 0, 0, 0.125)',
                  borderTop: 'none',
                  overflowX: 'auto'
                }}
                in={shownProfile == profile.name}
              >
                <pre>{JSON.stringify(profile.layouts, null, 2)}</pre>
              </Collapse>
            </>
          )
        )}
        {!virtualControlProfiles?.length && (
          <li>
            <CenteredText>No control profiles</CenteredText>
          </li>
        )}
      </ProfilesList>
      <IconButton
        aria-label={`Create new profile`}
        sx={{ padding: 0 }}
        onClick={() => addProfile()}
      >
        <StyledBiPlus />
      </IconButton>
    </>
  );
};
