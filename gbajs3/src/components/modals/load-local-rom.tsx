import { IconButton, InputAdornment, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useLocalStorage } from '@uidotdev/usehooks';
import { useDeferredValue, useState } from 'react';
import { BiHeart, BiSearch, BiSolidHeart, BiX } from 'react-icons/bi';

import { ModalBody } from './modal-body.tsx';
import { ModalHeader } from './modal-header.tsx';
import {
  emulatorGameLibraryLocalStorageKey,
  emulatorGameNameLocalStorageKey
} from '../../context/emulator/consts.ts';
import { useEmulatorContext, useModalContext } from '../../hooks/context.tsx';
import {
  useRunGame,
  type GameLibrary
} from '../../hooks/emulator/use-run-game.tsx';
import { CenteredText } from '../shared/styled.tsx';

type LibraryView = 'all' | 'recent' | 'favorites';

const Launcher = styled('div')`
  display: flex;
  flex-direction: column;
`;

const Controls = styled('div')`
  position: sticky;
  top: -1rem;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: -1rem -1rem 0;
  padding: 1rem 1rem 12px;
  background: ${({ theme }) => theme.modalContainerSurface};
`;

const Views = styled('div')`
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const ViewButton = styled('button')<{ $selected: boolean }>`
  min-height: 36px;
  flex: 0 0 auto;
  padding: 0 12px;
  color: ${({ theme, $selected }) =>
    $selected ? theme.pureWhite : theme.modalTextSecondary};
  background: ${({ theme, $selected }) =>
    $selected ? theme.gbaThemeBlue : theme.modalSurfaceElevated};
  border: 1px solid
    ${({ theme, $selected }) =>
      $selected ? theme.gbaThemeBlue : theme.modalListBorder};
  border-radius: 999px;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 600;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.gbaThemeBlue};
    outline-offset: 2px;
  }
`;

const GameList = styled('ul')`
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  overflow: hidden;
  list-style: none;
  background: ${({ theme }) => theme.modalSurfaceElevated};
  border: 1px solid ${({ theme }) => theme.modalListBorder};
  border-radius: 10px;
`;

const GameRow = styled('li')`
  display: flex;
  align-items: stretch;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.modalListBorder};
  }
`;

const LaunchButton = styled('button')`
  min-width: 0;
  flex: 1;
  min-height: 56px;
  padding: 0.875rem 8px 0.875rem 1rem;
  color: ${({ theme }) => theme.modalTextPrimary};
  background: transparent;
  border: 0;
  font: inherit;
  text-align: left;

  &:hover,
  &:active,
  &:focus-visible {
    outline: none;
    background: ${({ theme }) => theme.modalListItemHoverSurface};
  }

  &:focus-visible {
    box-shadow: inset 3px 0 0 ${({ theme }) => theme.gbaThemeBlue};
  }
`;

const GameName = styled('span')`
  display: block;
  overflow-wrap: anywhere;
  line-height: 1.35;
`;

const FavoriteButton = styled(IconButton)`
  align-self: stretch;
  width: 48px;
  margin-right: 2px;
  border-radius: 0;
`;

const EmptyState = styled(CenteredText)`
  padding: 1.5rem 1rem;
  color: ${({ theme }) => theme.modalTextSecondary};
`;

const libraryViewLabels: [LibraryView, string][] = [
  ['all', 'A-Z'],
  ['recent', 'Recent'],
  ['favorites', 'Favorites']
];

const displayName = (romName: string) => romName.replace(/\.[^.]+$/, '');

const getViewGames = (
  view: LibraryView,
  localRoms: string[],
  recentGames: string[],
  favoriteGames: string[],
  library: GameLibrary
) => {
  switch (view) {
    case 'recent':
      return [...recentGames].sort(
        (a, b) =>
          (library[b]?.lastPlayed ?? 0) - (library[a]?.lastPlayed ?? 0) ||
          a.localeCompare(b)
      );
    case 'favorites':
      return [...favoriteGames].sort((a, b) => a.localeCompare(b));
    case 'all':
      return [...localRoms].sort((a, b) => a.localeCompare(b));
  }
};

const getEmptyCopy = (
  view: LibraryView,
  hasLocalRoms: boolean,
  query: string
) => {
  if (!hasLocalRoms) return 'No local games yet. Upload a ROM to add it here.';
  if (query) return `No games match "${query}".`;

  switch (view) {
    case 'recent':
      return 'No games played yet.';
    case 'favorites':
      return 'No favorites yet. Use the heart beside a game to add one.';
    case 'all':
      return 'No games match this view.';
  }
};

export const LoadLocalRomModal = () => {
  const { closeModal } = useModalContext();
  const { emulator } = useEmulatorContext();
  const runGame = useRunGame();
  const [library, setLibrary] = useLocalStorage<GameLibrary>(
    emulatorGameLibraryLocalStorageKey,
    {}
  );
  const [lastGame] = useLocalStorage<string | undefined>(
    emulatorGameNameLocalStorageKey
  );
  const [view, setView] = useState<LibraryView>('all');
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());
  const localRoms = emulator?.listRoms() ?? [];
  const recentGames = localRoms.filter(
    (romName) => romName === lastGame || !!library[romName]?.lastPlayed
  );
  const favoriteGames = localRoms.filter(
    (romName) => !!library[romName]?.favorite
  );
  const viewGames = getViewGames(
    view,
    localRoms,
    recentGames,
    favoriteGames,
    library
  );
  const games = viewGames.filter((romName) =>
    `${displayName(romName)} ${romName}`
      .toLocaleLowerCase()
      .includes(deferredQuery)
  );
  const emptyCopy = getEmptyCopy(view, !!localRoms.length, query.trim());

  const toggleFavorite = (romName: string) => {
    setLibrary((currentLibrary) => ({
      ...currentLibrary,
      [romName]: {
        favorite: !currentLibrary[romName]?.favorite,
        lastPlayed: currentLibrary[romName]?.lastPlayed ?? 0
      }
    }));
  };

  return (
    <>
      <ModalHeader title="Load Local Rom" />
      <ModalBody>
        <Launcher>
          <Controls>
            <TextField
              aria-label="Search games"
              placeholder="Search games"
              size="small"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <BiSearch />
                    </InputAdornment>
                  ),
                  endAdornment: query && (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="Clear search"
                        edge="end"
                        size="small"
                        onClick={() => {
                          setQuery('');
                        }}
                      >
                        <BiX />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />
            <Views aria-label="Game library views">
              {libraryViewLabels.map(([nextView, label]) => (
                <ViewButton
                  key={nextView}
                  $selected={view === nextView}
                  aria-pressed={view === nextView}
                  onClick={() => {
                    setView(nextView);
                  }}
                >
                  {label}
                </ViewButton>
              ))}
            </Views>
          </Controls>
          <GameList aria-label="Local games">
            {games.map((romName) => {
              const favorite = !!library[romName]?.favorite;
              return (
                <GameRow key={romName}>
                  <LaunchButton
                    aria-label={`Play ${romName}`}
                    onClick={() => {
                      runGame(romName);
                      closeModal();
                    }}
                  >
                    <GameName>{romName}</GameName>
                  </LaunchButton>
                  <FavoriteButton
                    aria-label={`${favorite ? 'Remove' : 'Add'} ${romName} ${
                      favorite ? 'from' : 'to'
                    } favorites`}
                    color={favorite ? 'primary' : 'default'}
                    onClick={() => {
                      toggleFavorite(romName);
                    }}
                  >
                    {favorite ? <BiSolidHeart /> : <BiHeart />}
                  </FavoriteButton>
                </GameRow>
              );
            })}
            {!games.length && (
              <li>
                <EmptyState>{emptyCopy}</EmptyState>
              </li>
            )}
          </GameList>
        </Launcher>
      </ModalBody>
    </>
  );
};
