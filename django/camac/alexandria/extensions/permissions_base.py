class Permission:
    write = False
    destroy = False

    @classmethod
    def can_create(cls, group, instance) -> bool:
        return cls.write

    @classmethod
    def can_update(cls, group, document) -> bool:
        return cls.write

    @classmethod
    def can_destroy(cls, group, document) -> bool:
        return cls.destroy


class ReadPermission(Permission):
    """Read permission."""

    pass


class WritePermission(Permission):
    """Read and write permission."""

    write = True


class AdminPermission(WritePermission):
    """Read, write and delete permission."""

    destroy = True


class AdminServicePermission(AdminPermission):
    """Read and write permissions for all attachments, but delete only on attachments owned by the current service."""

    @classmethod
    def is_owned_by_service(cls, group, document) -> bool:
        return not document or int(document.created_by_group) == group.service.pk

    @classmethod
    def can_destroy(cls, group, document) -> bool:
        return cls.is_owned_by_service(group, document) and super().can_destroy(
            group, document
        )


class InternalReadPermission(ReadPermission):
    """Read permission on attachments owned by the current service."""

    pass


class InternalAdminPermission(AdminServicePermission):
    """Read, write and delete permission on attachments owned by the current service."""

    @classmethod
    def can_create(cls, group, instance) -> bool:
        return super().can_create(group, instance)

    @classmethod
    def can_update(cls, group, document) -> bool:
        return cls.is_owned_by_service(group, document) and super().can_update(
            group, document
        )


class AdminDeletableStatePermission(AdminPermission):
    """Read and write permission, but delete only in certain states."""

    deletable_states = []

    @classmethod
    def in_deleteable_state(cls, instance) -> bool:
        return instance.instance_state.name in cls.deletable_states

    @classmethod
    def can_destroy(cls, group, document) -> bool:
        return cls.in_deleteable_state(
            document.instance_document.instance
        ) and super().can_destroy(
            group,
            document,
        )


class AdminStatePermission(AdminDeletableStatePermission):
    """Read, but write and delete only in certain states."""

    writable_states = []

    @classmethod
    def in_writable_state(cls, instance) -> bool:
        return instance.instance_state.name in cls.writable_states

    @classmethod
    def can_create(cls, group, instance) -> bool:
        return cls.in_writable_state(instance) and super().can_create(
            group,
            instance,
        )

    @classmethod
    def can_update(cls, group, document) -> bool:
        return cls.in_writable_state(
            document.instance_document.instance
        ) and super().can_update(
            group,
            document,
        )
