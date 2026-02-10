import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, RefreshCw, Share2, MessageCircle, MessageSquare, Copy } from 'lucide-react';
import { useTeamStore } from '@/hooks/useTeamStore';
import { Input } from '@/components/ui/input';
import PlayerAvatar from '@/components/PlayerAvatar';
import { useSyncSettings } from '@/hooks/useSyncSettings';
import { createSyncShareLink } from '@/lib/share';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Settings() {
  const { players, addPlayer, updatePlayer, removePlayer } = useTeamStore();
  const { teams, activeTeam, syncEnabled, setSyncEnabled, createTeamSpace, updateActiveTeamName, setActiveTeam, removeTeam } = useSyncSettings();
  const [newName, setNewName] = useState('');
  const [teamNameInput, setTeamNameInput] = useState(activeTeam?.teamName ?? '');
  const [renameTeamInput, setRenameTeamInput] = useState(activeTeam?.teamName ?? '');
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isRenameTeamModalOpen, setIsRenameTeamModalOpen] = useState(false);
  const [isRemoveTeamModalOpen, setIsRemoveTeamModalOpen] = useState(false);

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (trimmed && players.length < 4) {
      addPlayer(trimmed);
      setNewName('');
    }
  };

  const hasTeamSpace = Boolean(activeTeam?.syncToken);
  const canShareActiveTeam = Boolean(activeTeam?.syncEnabled && activeTeam?.syncToken);

  useEffect(() => {
    setTeamNameInput(activeTeam?.teamName ?? '');
    setRenameTeamInput(activeTeam?.teamName ?? '');
  }, [activeTeam?.id, activeTeam?.teamName]);

  const handleCreateTeamSpace = () => {
    const trimmed = teamNameInput.trim();
    if (!trimmed) {
      toast.error('Enter a team name first');
      return;
    }

    createTeamSpace(trimmed);
    toast.success(`Team space created for ${trimmed}`);
    setIsTeamModalOpen(false);
    setTeamNameInput('');
  };

  const handleRenameTeam = () => {
    const trimmed = renameTeamInput.trim();
    if (!trimmed) {
      toast.error('Enter a team name first');
      return;
    }
    updateActiveTeamName(trimmed);
    toast.success('Team renamed');
    setIsRenameTeamModalOpen(false);
  };

  const openAddTeamModal = () => {
    setTeamNameInput('');
    setIsTeamModalOpen(true);
  };

  const openRenameTeamModal = () => {
    if (!activeTeam) return;
    setRenameTeamInput(activeTeam.teamName);
    setIsRenameTeamModalOpen(true);
  };

  const getShareLink = () => {
    if (!activeTeam?.syncToken || !activeTeam?.syncEnabled) {
      toast.error('Enable Cloud Sync for this team first');
      return null;
    }

    return createSyncShareLink(activeTeam.syncToken);
  };

  const handleNativeShare = async () => {
    const shareLink = getShareLink();
    if (!shareLink) return;

    const teamLabel = activeTeam?.teamName || 'my team';
    const shareText = `Join ${teamLabel} on Padel Matches: ${shareLink}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Padel Matches',
          text: `Join ${teamLabel} on Padel Matches`,
          url: shareLink,
        });
      } catch {
        // Share sheet was dismissed or failed.
      }
      return;
    }

    await navigator.clipboard.writeText(shareText);
    toast.success('Share link copied');
  };

  const handleCopyLink = async () => {
    const shareLink = getShareLink();
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    toast.success('Link copied');
  };

  const shareLink = canShareActiveTeam ? createSyncShareLink(activeTeam!.syncToken) : '';
  const whatsappHref = shareLink
    ? `https://wa.me/?text=${encodeURIComponent(`Join ${activeTeam?.teamName || 'my team'} on Padel Matches: ${shareLink}`)}`
    : '#';
  const smsHref = shareLink
    ? `sms:?&body=${encodeURIComponent(`Join ${activeTeam?.teamName || 'my team'} on Padel Matches: ${shareLink}`)}`
    : '#';

  const handleRemoveActiveTeam = () => {
    if (!activeTeam) return;
    setIsRemoveTeamModalOpen(true);
  };

  const handleConfirmRemoveActiveTeam = () => {
    if (!activeTeam) return;
    removeTeam(activeTeam.id);
    setIsRemoveTeamModalOpen(false);
  };

  return (
    <div className="flex flex-col px-4 pt-14 pb-8 gap-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>

      {/* Team section */}
      <section>
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your Team ({players.length})
          </h2>
        </div>

        <div className="ios-grouped">
          <AnimatePresence initial={false}>
            {players.map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <PlayerAvatar name={player.name || 'P'} />
                  <Input
                    value={player.name}
                    onChange={e => updatePlayer(player.id, e.target.value)}
                    className="flex-1 border-0 bg-transparent p-0 h-auto text-base rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                    placeholder="Player name"
                  />
                  <button
                    onClick={() => removePlayer(player.id)}
                    className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <Minus className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
                {i < players.length - 1 && <div className="ios-separator" />}
              </motion.div>
            ))}
          </AnimatePresence>

          {players.length === 0 && (
            <div className="px-4 py-6 text-center text-muted-foreground text-sm">
              No players added yet
            </div>
          )}
        </div>

        <div className="ios-grouped mt-4">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success/10">
              <Plus className="w-4 h-4 text-success" />
            </div>
            <div className="flex-1">
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="Type player name"
                className="h-10 rounded-lg border border-border/70 bg-background px-3 text-sm"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="text-primary font-medium text-sm disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-2 px-1">
          <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Cloud Sync
          </h2>
        </div>
        <div className="ios-grouped">
          <div className="px-4 py-3 space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/20 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-foreground">Enable Cloud Sync</p>
                <p className="text-[11px] text-muted-foreground">
                  {syncEnabled ? 'Sync is active for the selected team.' : 'Sync is off. Data stays local on this device.'}
                </p>
              </div>
              <Switch checked={syncEnabled} onCheckedChange={setSyncEnabled} />
            </div>
            <button
              onClick={openAddTeamModal}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold active:scale-[0.98] transition-transform"
            >
              Add New Team
            </button>
            {teams.length > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <select
                    value={activeTeam?.id ?? ''}
                    onChange={(e) => setActiveTeam(e.target.value)}
                    className="flex-1 h-10 rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground"
                  >
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.teamName}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={openRenameTeamModal}
                    className="h-10 px-3 rounded-lg bg-secondary text-foreground text-sm font-medium"
                  >
                    Rename
                  </button>
                  <button
                    onClick={handleRemoveActiveTeam}
                    disabled={activeTeam?.isDefault}
                    className="h-10 px-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
                {hasTeamSpace ? (
                  <p className="text-[11px] leading-tight text-success">
                    Active team: {activeTeam?.teamName}. Secret is stored securely and hidden.
                  </p>
                ) : (
                  <p className="text-[11px] leading-tight text-muted-foreground">
                    Enable sync to create a secure sync space for {activeTeam?.teamName}.
                  </p>
                )}
                {activeTeam?.isDefault && (
                  <p className="text-[11px] leading-tight text-muted-foreground">
                    Personal team is your local default and cannot be removed.
                  </p>
                )}
              </>
            )}
            <p className="mt-2 text-[11px] leading-tight text-muted-foreground">
              Team name is visible. A hidden team secret is generated automatically for secure sync.
            </p>
          </div>
        </div>
      </section>

      {canShareActiveTeam && (
        <section>
          <div className="flex items-center gap-2 mb-2 px-1">
            <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Share App
            </h2>
          </div>
          <div className="ios-grouped">
            <div className="px-4 py-3 flex flex-col gap-2.5">
              <button
                onClick={handleNativeShare}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold active:scale-[0.98] transition-transform"
              >
                Share App Link
              </button>

              <div className="grid grid-cols-3 gap-2">
                <a
                  href={whatsappHref}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium bg-success/10 text-success"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
                <a
                  href={smsHref}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium bg-secondary text-foreground"
                >
                  <MessageSquare className="w-4 h-4" />
                  SMS
                </a>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium bg-secondary text-foreground"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              </div>

              <p className="text-[11px] leading-tight text-muted-foreground">
                Shares an app link with your encoded team sync token. Opening the link imports the team automatically.
              </p>
            </div>
          </div>
        </section>
      )}

      <Dialog open={isTeamModalOpen} onOpenChange={setIsTeamModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Team</DialogTitle>
            <DialogDescription>
              Enter a team name. We will generate a hidden team secret automatically and create a secure sync space.
            </DialogDescription>
          </DialogHeader>
          <div className="py-1">
            <Input
              value={teamNameInput}
              onChange={(e) => setTeamNameInput(e.target.value)}
              placeholder="Team name"
              className="h-10 text-sm"
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsTeamModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTeamSpace}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
            >
              Add Team
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameTeamModalOpen} onOpenChange={setIsRenameTeamModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Team</DialogTitle>
            <DialogDescription>
              Update the name shown in the app and in share links for this team.
            </DialogDescription>
          </DialogHeader>
          <div className="py-1">
            <Input
              value={renameTeamInput}
              onChange={(e) => setRenameTeamInput(e.target.value)}
              placeholder="Team name"
              className="h-10 text-sm"
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsRenameTeamModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleRenameTeam}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
            >
              Save Name
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isRemoveTeamModalOpen} onOpenChange={setIsRemoveTeamModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes "{activeTeam?.teamName}" from this device. Your local team data stays on this team profile unless you delete it separately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemoveActiveTeam}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
