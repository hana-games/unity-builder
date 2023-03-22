using System;
using UnityEditor;

namespace UnityBuilderAction.Versioning
{
  public class VersionApplicator
  {
    public static void SetVersion(string version)
    {
      UnityEngine.Debug.Log("[SDKOPRST] 7");
      if (version == "none") {
        return;
      }

      Apply(version);
    }

    public static void SetAndroidVersionCode(string androidVersionCode) {
      UnityEngine.Debug.Log("[SDKOPRST] 8");
      int bundleVersionCode = Int32.Parse(androidVersionCode);
      if (bundleVersionCode <= 0) {
        return;
      }
	  
      UnityEngine.Debug.Log("[SDKOPRST] 10");
      PlayerSettings.Android.bundleVersionCode = bundleVersionCode;
    }

    static void Apply(string version)
    {
      UnityEngine.Debug.Log("[SDKOPRST] 9");
      PlayerSettings.bundleVersion = version;
      PlayerSettings.macOS.buildNumber = version;
    }
  }
}
