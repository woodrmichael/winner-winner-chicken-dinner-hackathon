import type { DemoState, DirectoryCommand, Partner } from '../../domain/types';
import { availabilityForCategories, normalizePartner } from '../matching/directory';

export function applyDirectoryCommand(state: DemoState, cmd: DirectoryCommand): DemoState {
  switch (cmd.type) {
    case 'set-service-availability': {
      const partners = state.partners.map((partner) => {
        if (partner.id !== cmd.partnerId) return partner;
        if (!partner.categories.includes(cmd.category) && cmd.category !== 'Other') {
          throw new Error('This organization does not offer that service.');
        }
        return {
          ...partner,
          availability: {
            ...partner.availability,
            [cmd.category]: cmd.accepting ? 'accepting' : 'paused',
          },
        };
      });
      if (!state.partners.some((partner) => partner.id === cmd.partnerId)) {
        throw new Error('Organization unavailable.');
      }
      return { ...state, partners };
    }
    case 'submit-partner-listing': {
      if (state.partners.some((partner) => partner.id === cmd.id)) {
        throw new Error('That organization is already in the directory.');
      }
      if (!cmd.name.trim() || !cmd.categories.length) {
        throw new Error('Name and at least one service are required.');
      }
      const partner = normalizePartner({
        id: cmd.id,
        name: cmd.name.trim(),
        area: cmd.area,
        categories: cmd.categories,
        coverageAreas: cmd.coverageAreas?.length ? cmd.coverageAreas : [cmd.area],
        pickup: cmd.pickup,
        listingStatus: 'pending',
        availability: {},
      });
      return { ...state, partners: [...state.partners, partner] };
    }
    case 'approve-partner-listing': {
      let found: Partner | undefined;
      const partners = state.partners.map((partner) => {
        if (partner.id !== cmd.partnerId) return partner;
        found = partner;
        if (partner.listingStatus === 'approved') return partner;
        if (partner.listingStatus === 'declined' || partner.listingStatus === 'removed') {
          throw new Error('This listing is no longer available to approve.');
        }
        const { declineReason: _cleared, ...rest } = partner;
        return { ...rest, listingStatus: 'approved' as const };
      });
      if (!found) throw new Error('Listing unavailable.');
      return found.listingStatus === 'approved' ? state : { ...state, partners };
    }
    case 'decline-partner-listing': {
      let found: Partner | undefined;
      const note = cmd.reason?.trim();
      const partners = state.partners.map((partner) => {
        if (partner.id !== cmd.partnerId) return partner;
        found = partner;
        if (partner.listingStatus === 'declined') return partner;
        if (partner.listingStatus === 'approved' || partner.listingStatus === 'removed') {
          throw new Error('Approved listings cannot be declined from this queue.');
        }
        return {
          ...partner,
          listingStatus: 'declined' as const,
          ...(note ? { declineReason: note } : { declineReason: undefined }),
        };
      });
      if (!found) throw new Error('Listing unavailable.');
      return found.listingStatus === 'declined' ? state : { ...state, partners };
    }
    case 'update-partner-listing': {
      if (!cmd.name.trim() || !cmd.categories.length) {
        throw new Error('Name and at least one service are required.');
      }
      if (!cmd.coverageAreas.length) {
        throw new Error('Choose at least one coverage area.');
      }
      if (!cmd.coverageAreas.includes(cmd.area)) {
        throw new Error('Coverage areas must include the primary service area.');
      }
      let found: Partner | undefined;
      const partners = state.partners.map((partner) => {
        if (partner.id !== cmd.partnerId) return partner;
        found = partner;
        if (partner.listingStatus === 'removed' || partner.listingStatus === 'declined') {
          throw new Error('This organization is no longer in the directory.');
        }
        return {
          ...partner,
          name: cmd.name.trim(),
          area: cmd.area,
          categories: [...cmd.categories],
          coverageAreas: [...cmd.coverageAreas],
          pickup: cmd.pickup.trim() || partner.pickup,
          availability: availabilityForCategories(partner.availability, cmd.categories),
        };
      });
      if (!found) throw new Error('Organization unavailable.');
      return { ...state, partners };
    }
    case 'delete-partner-listing': {
      let found: Partner | undefined;
      const partners = state.partners.map((partner) => {
        if (partner.id !== cmd.partnerId) return partner;
        found = partner;
        if (partner.listingStatus === 'removed') return partner;
        return { ...partner, listingStatus: 'removed' as const };
      });
      if (!found) throw new Error('Organization unavailable.');
      return found.listingStatus === 'removed' ? state : { ...state, partners };
    }
  }
}
