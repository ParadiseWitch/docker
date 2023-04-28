import { logger } from "@raopics/utils";
import { getPrisma, Folder } from "@raopics/prisma-client";

// 多级嵌套转为一级
const demotionFolder = (folders: EagleUse.Folder[]): Folder[] => {
  const newFolders = [];

  const callback = (item) => {
    (item.children || (item.children = [])).map((v) => {
      v.pid = item.id;
      callback(v);
    });

    delete item.children;
    delete item.tags;
    newFolders.push(item);
  };

  folders.map((v) => callback(v));
  return newFolders;
};

export const handleFloder = async (metadataFolders: EagleUse.Folder[]) => {
  const folders = demotionFolder(metadataFolders);

  folders.forEach((folder) => {
    getPrisma()
      .folder.upsert({
        where: { id: folder.id },
        update: folder,
        create: folder,
      })
      .catch((e) => logger.info(e, "Folder error: "));
  });

  deleteUnnecessary(folders);
};

const deleteUnnecessary = (localFolder: Folder[]) => {
  getPrisma()
    .folder.findMany({
      where: {
        id: {
          notIn: localFolder.map((item) => item.id),
        },
      },
    })
    .then((folders) => {
      if (folders && folders.length > 0) {
        getPrisma()
          .folder.deleteMany({
            where: {
              id: {
                in: folders.map((item) => item.id),
              },
            },
          })
          .catch((e) => {
            logger.error(e, "Delete folder error: ");
          });
      }
    });
};
