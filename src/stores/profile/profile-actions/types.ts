import { RoleT, ViewPrivacyT } from '@shared/config/types'
import { Profile, User, UserMore } from '../types'

export type EditProfileBody = Partial<Profile> | { more: Partial<UserMore> }
export type EditUserBody = Partial<User> | { more: Partial<UserMore> }

// PRIVACY

export interface PrivacyException {
	name: string
	tag: string
	id: string
	more: {
		logo: string
		who: string
		role: RoleT
		p_lang: string[]
	}
}

export interface EditPrivacySettingsBody {
	"planRule": ViewPrivacyT
	"goalRule": ViewPrivacyT
	"friendRule": ViewPrivacyT
	"hbRule": ViewPrivacyT
	"phoneRule": ViewPrivacyT
	"descriptionRule": ViewPrivacyT
	"lastSeenRule": ViewPrivacyT
	"profilePhotoRule": ViewPrivacyT
	"callsRule": ViewPrivacyT
	"forwardsRule": ViewPrivacyT
	"groupsRule": ViewPrivacyT
}

export interface GetPrivacySettingsResponse extends EditPrivacySettingsBody {
	"planAllowExceptions": PrivacyException[]
	"planDenyExceptions": PrivacyException[]
	"goalAllowExceptions": PrivacyException[]
	"goalDenyExceptions": PrivacyException[]
	"friendAllowExceptions": PrivacyException[]
	"friendDenyExceptions": PrivacyException[]
	"hbAllowExceptions": PrivacyException[]
	"hbDenyExceptions": PrivacyException[]
	"phoneAllowExceptions": PrivacyException[]
	"phoneDenyExceptions": PrivacyException[]
	"descriptionAllowExceptions": PrivacyException[]
	"descriptionDenyExceptions": PrivacyException[]
	"lastSeenAllowExceptions": PrivacyException[]
	"lastSeenDenyExceptions": PrivacyException[]
	"profilePhotoAllowExceptions": PrivacyException[]
	"profilePhotoDenyExceptions": PrivacyException[]
	"callsAllowExceptions": PrivacyException[]
	"callsDenyExceptions": PrivacyException[]
	"forwardsAllowExceptions": PrivacyException[]
	"forwardsDenyExceptions": PrivacyException[]
	"groupsAllowExceptions": PrivacyException[]
	"groupsDenyExceptions": PrivacyException[]
}

export interface GetPrivacyParams {
}