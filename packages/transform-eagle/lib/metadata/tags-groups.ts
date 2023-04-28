import { logger } from "@raopics/utils";
import { getPrisma } from "@raopics/prisma-client";

export const handleTagsGroups = (localTagsGroups: EagleUse.TagsGroupsItem[]) => {
  localTagsGroups.forEach((item) => {
    const tags = (item.tags as string[]) || [];

    const data = {
      ...item,
      tags: {
        connectOrCreate: tags.map((tag) => ({
          where: { id: tag },
          create: { id: tag, name: tag },
        })),
      },
    };

    getPrisma()
      .tagsGroups.upsert({
        where: { id: item.id },
        create: data,
        update: data,
      })
      .catch((e) => logger.info(e, "TagsGroups error: "));
  });

  deleteUnnecessary(localTagsGroups);
};

const deleteUnnecessary = (localTagsGroup: EagleUse.TagsGroupsItem[]) => {
  getPrisma()
    .tagsGroups.findMany({
      where: {
        id: {
          notIn: localTagsGroup.map((item) => item.id),
        },
      },
    })
    .then((tagsGroups) => {
      if (tagsGroups && tagsGroups.length > 0) {
        getPrisma()
          .tagsGroups.deleteMany({
            where: {
              id: {
                in: tagsGroups.map((item) => item.id),
              },
            },
          })
          .catch((e) => {
            logger.error(e, "TagsGroups Delete error: ");
          });
      }
    });
};
