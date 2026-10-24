import { Button, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useDeferredValue, useId, useState } from 'react';
import { BiError } from 'react-icons/bi';

import { ModalBody } from './modal-body.tsx';
import { ModalFooter } from './modal-footer.tsx';
import { ModalHeader } from './modal-header.tsx';
import { useEmulatorContext, useModalContext } from '../../hooks/context.tsx';
import { useAddCallbacks } from '../../hooks/emulator/use-add-callbacks.tsx';
import { useRunGame } from '../../hooks/emulator/use-run-game.tsx';
import {
  type HomebrewEntry,
  useHomebrewCatalog
} from '../../hooks/use-homebrew-catalog.tsx';
import { useLoadExternalRom } from '../../hooks/use-load-external-rom.tsx';
import { ErrorWithIcon } from '../shared/error-with-icon.tsx';
import {
  LoadingIndicator,
  PacmanIndicator
} from '../shared/loading-indicator.tsx';

const CatalogItem = styled('li')`
  margin: 0;
`;

const CatalogList = styled('ul')`
  list-style: none;
  display: flex;
  flex-direction: column;
  margin: 1rem 0 0;
  padding: 0;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.modalListBorder};
  border-radius: 10px;
  background: ${({ theme }) => theme.modalSurfaceElevated};

  & > ${CatalogItem} + ${CatalogItem} {
    border-top: 1px solid ${({ theme }) => theme.modalListBorder};
  }
`;

const BrowseButton = styled('button')`
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 72px;
  padding: 0.5rem 0.75rem;
  color: ${({ theme }) => theme.modalTextPrimary};
  background-color: transparent;
  border: 0;
  cursor: pointer;
  font: inherit;
  text-align: left;

  &:hover,
  &:active {
    background-color: ${({ theme }) => theme.modalListItemHoverSurface};
  }

  &:focus-visible {
    position: relative;
    z-index: 1;
    outline: none;
    background-color: ${({ theme }) => theme.modalListItemHoverSurface};
    box-shadow: inset 0 0 0 1px ${({ theme }) => theme.gbaThemeBlue};
  }
`;

const Cover = styled('img')`
  display: block;
  width: 56px;
  height: 56px;
  flex: 0 0 56px;
  object-fit: cover;
  border-radius: 6px;
  background: ${({ theme }) => theme.mediumBlack};
`;

const DetailCover = styled(Cover)`
  width: min(100%, 180px);
  height: 180px;
  margin: 0 auto;
`;

const CoverPlaceholder = styled('div')`
  display: grid;
  width: 56px;
  height: 56px;
  flex: 0 0 56px;
  place-items: center;
  border-radius: 6px;
  background: ${({ theme }) => theme.mediumBlack};
  color: ${({ theme }) => theme.modalTextSecondary};
  font-weight: 600;
`;

const DetailCoverPlaceholder = styled(CoverPlaceholder)`
  width: min(100%, 180px);
  height: 180px;
  margin: 0 auto;
`;

const GameCopy = styled('span')`
  min-width: 0;
  margin-left: 0.75rem;
`;

const GameTitle = styled('strong')`
  display: block;
  overflow: hidden;
  color: ${({ theme }) => theme.modalTextPrimary};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const GameMeta = styled('span')`
  display: block;
  overflow: hidden;
  margin-top: 0.25rem;
  color: ${({ theme }) => theme.modalTextSecondary};
  font-size: 0.875rem;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DetailCopy = styled('p')`
  margin: 0.75rem 0 0;
  color: ${({ theme }) => theme.modalTextSecondary};
  line-height: 1.5;
`;

const EmptyState = styled('p')`
  padding: 1rem;
  color: ${({ theme }) => theme.modalTextSecondary};
  text-align: center;
`;

export const HomebrewLibraryModal = () => {
  const { closeModal } = useModalContext();
  const { emulator } = useEmulatorContext();
  const runGame = useRunGame();
  const { syncActionIfEnabled } = useAddCallbacks();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const [visibleEntries, setVisibleEntries] = useState(10);
  const [selectedEntry, setSelectedEntry] = useState<HomebrewEntry>();
  const [currentRom, setCurrentRom] = useState<HomebrewEntry>();
  const searchId = useId();
  const { data: catalog, isPending, error } = useHomebrewCatalog();
  const { isPending: isRomLoading, mutate: loadRom } = useLoadExternalRom({
    onSuccess: (file) => {
      const runCallback = async () => {
        await syncActionIfEnabled();
        if (runGame(file.name)) closeModal();
      };

      emulator?.uploadRom(file, runCallback);
      setCurrentRom(undefined);
    }
  });
  const entries =
    catalog?.entries.filter((entry) => {
      if (!deferredQuery) return true;

      return [
        entry.title,
        entry.developer,
        entry.description,
        ...(entry.tags ?? [])
      ]
        .filter((value): value is string => !!value)
        .some((value) => value.toLowerCase().includes(deferredQuery));
    }) ?? [];
  const visibleHomebrewEntries = entries.slice(0, visibleEntries);

  return (
    <>
      <ModalHeader title={selectedEntry?.title ?? 'Homebrew Library'} />
      <ModalBody
        onScroll={(event) => {
          const { clientHeight, scrollHeight, scrollTop } = event.currentTarget;
          if (
            entries.length > visibleEntries &&
            scrollTop + clientHeight >= scrollHeight - 200
          ) {
            setVisibleEntries((current) =>
              Math.min(current + 10, entries.length)
            );
          }
        }}
      >
        {isPending ? (
          <PacmanIndicator />
        ) : (
          <LoadingIndicator
            isLoading={isRomLoading}
            currentName={currentRom?.title ?? null}
            indicator={<PacmanIndicator />}
            loadingCopy="Downloading homebrew:"
          >
            {selectedEntry ? (
              <>
                {selectedEntry.cover ? (
                  <DetailCover
                    src={selectedEntry.cover.url}
                    alt={`Cover art for ${selectedEntry.title}`}
                  />
                ) : (
                  <DetailCoverPlaceholder aria-hidden />
                )}
                <GameMeta>
                  {[selectedEntry.developer, selectedEntry.license]
                    .filter(Boolean)
                    .join(' - ')}
                </GameMeta>
                {selectedEntry.description && (
                  <DetailCopy>{selectedEntry.description}</DetailCopy>
                )}
              </>
            ) : (
              <>
                <TextField
                  id={searchId}
                  label={
                    catalog
                      ? `Search ${catalog.entries.length} homebrew games`
                      : 'Search homebrew games'
                  }
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setVisibleEntries(10);
                  }}
                  fullWidth
                  size="small"
                />
                {!!error && (
                  <ErrorWithIcon
                    icon={<BiError />}
                    text="The homebrew catalog could not be loaded"
                  />
                )}
                {!!visibleHomebrewEntries.length && (
                  <CatalogList>
                    {visibleHomebrewEntries.map((entry) => (
                      <CatalogItem key={entry.slug}>
                        <BrowseButton
                          onClick={() => {
                            setSelectedEntry(entry);
                          }}
                        >
                          {entry.cover ? (
                            <Cover
                              src={entry.cover.url}
                              alt=""
                              loading="lazy"
                            />
                          ) : (
                            <CoverPlaceholder aria-hidden />
                          )}
                          <GameCopy>
                            <GameTitle>{entry.title}</GameTitle>
                            <GameMeta>
                              {[entry.platform, entry.developer, entry.license]
                                .filter(Boolean)
                                .join(' - ')}
                            </GameMeta>
                          </GameCopy>
                        </BrowseButton>
                      </CatalogItem>
                    ))}
                  </CatalogList>
                )}
                {!error && !entries.length && (
                  <EmptyState>No homebrew games match your search.</EmptyState>
                )}
                {entries.length > visibleEntries && (
                  <Button
                    fullWidth
                    onClick={() => {
                      setVisibleEntries((current) =>
                        Math.min(current + 10, entries.length)
                      );
                    }}
                  >
                    Load more games
                  </Button>
                )}
              </>
            )}
          </LoadingIndicator>
        )}
      </ModalBody>
      <ModalFooter>
        {selectedEntry ? (
          <>
            <Button
              variant="outlined"
              onClick={() => {
                setSelectedEntry(undefined);
              }}
            >
              Back
            </Button>
            {selectedEntry.website && (
              <Button
                component="a"
                href={selectedEntry.website}
                target="_blank"
                rel="noopener"
                variant="outlined"
              >
                Source
              </Button>
            )}
            <Button
              variant="contained"
              onClick={() => {
                setCurrentRom(selectedEntry);
                loadRom({ url: new URL(selectedEntry.rom.url) });
              }}
            >
              Download and Play
            </Button>
          </>
        ) : (
          <Button variant="outlined" onClick={closeModal}>
            Close
          </Button>
        )}
      </ModalFooter>
    </>
  );
};
