import { Collapse, IconButton } from '@mui/material';
import { useLocalStorage } from '@uidotdev/usehooks';
import { useState } from 'react';
import { BiPlus, BiTrash, BiShow, BiEdit } from 'react-icons/bi';
import { styled } from 'styled-components';

import { useLayoutContext } from '../../../hooks/context.tsx';
import { virtualControlProfilesLocalStorageKey } from '../../controls/consts.tsx';
import { CenteredText } from '../../shared/styled.tsx';

import type { Layouts } from '../../../hooks/use-layouts.tsx';

type ControlProfilesFormProps = {
  id: string;
  onAfterSubmit: () => void;
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
  grid-template-columns: auto 32px 32px 32px;
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

const StyledBiEdit = styled(BiEdit)`
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

export const ControlProfilesForm = ({
  id
}: // onAfterSubmit?
ControlProfilesFormProps) => {
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
              <StyledLi key={`${profile.name}_${idx}`}>
                <LoadProfileButton onClick={() => setLayouts(profile.layouts)}>
                  {profile.name}
                </LoadProfileButton>
                <IconButton
                  aria-label={`Edit ${profile.name}`}
                  sx={{ padding: 0 }}
                  onClick={() => {
                    console.log('edit', profile.name);
                  }}
                >
                  <StyledBiEdit />
                </IconButton>
                <IconButton
                  aria-label={`Show ${profile.name}`}
                  sx={{ padding: 0 }}
                  onClick={() => {
                    console.log('show', profile.name);
                    setShownProfile(
                      profile.name === shownProfile ? undefined : profile.name
                    );
                  }}
                >
                  <StyledBiShow />
                </IconButton>
                <IconButton
                  aria-label={`Delete ${profile.name}`}
                  sx={{ padding: 0 }}
                  onClick={() => deleteProfile(profile.name)}
                >
                  <StyledCiCircleRemove />
                </IconButton>
              </StyledLi>
              <Collapse in={shownProfile == profile.name}>
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
