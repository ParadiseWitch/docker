import { TransformBeforeArgs } from "@raopics/transform-eagle";
import { getPredictions, modelType, options } from "./core";

const _NSFWTags = ["Drawing", "Hentai", "Neutral", "Porn", "Sexy"];

/**
 *
 * @param param0 TransformBeforeArgs
 * @param probability predictions[].probability > 阈值, 默认0.35
 * @returns
 */
const PLUGIN_NSFW = async function (
  { metadata, database }: TransformBeforeArgs,
  options?: {
    probability?: number;
    model?: modelType;
    modelOptions?: options;
  }
) {
  const { probability = 0.35, model, modelOptions } = options;
  if (["jpg", "jpeg", "bmp", "png"].includes(metadata.ext)) {
    const { LIBRARY } = process.env;
    const { tags } = metadata;

    const createNSFW = async () => {
      const predictions = await getPredictions(
        `${LIBRARY}/images/${metadata.id}.info/${metadata.name}.${metadata.ext}`,
        model || "quant_mid",
        modelOptions || { size: 224 }
      );

      const className = predictions
        .filter((item) => item.probability > probability)
        .map((item) => item.className);

      metadata.nsfw = true;
      metadata.tags = tags.concat(className);
    };

    if (database) {
      // 【Core】EagleApp 中导入图片，已经存在，并勾选使用已存在的图片，NSFW检测结果会被覆盖。 #90
      // https://github.com/rao-pics/core/issues/90
      const oldNSFWTags = database.tags.filter((item) => _NSFWTags.includes(item.name));

      if (oldNSFWTags && oldNSFWTags.length > 0) {
        metadata.tags = tags.concat(oldNSFWTags.map((item) => item.name));
      } else {
        await createNSFW();
      }
    } else {
      await createNSFW();
    }

    return metadata;
  }

  return metadata;
};

export default PLUGIN_NSFW;
