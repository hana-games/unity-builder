using System;
using UnityEditor;

namespace UnityBuilderAction.Versioning
{
  public class VersionApplicator
  {
    public static void SetVersion(string version)
    {
      UnityEngine.Debug.Log("Panic Panic Panic");
      if (version == "none") {
        return;
      }
      UnityEngine.Debug.Log("Sorry but not supposed to be here");
      Apply(version);
    }

    public static void SetAndroidVersionCode(string androidVersionCode) {
      UnityEngine.Debug.Log("Panic Panic Panic");
      int bundleVersionCode = Int32.Parse(androidVersionCode);
      if (bundleVersionCode <= 0) {
        return;
      }
	  
      UnityEngine.Debug.Log("Sorry but not supposed to be here");
      PlayerSettings.Android.bundleVersionCode = bundleVersionCode;
    }

    static void Apply(string version)
    {
      UnityEngine.Debug.Log("Panic Panic Panic");
      UnityEngine.Debug.Log("Sorry but not supposed to be here");
      PlayerSettings.bundleVersion = version;
      PlayerSettings.macOS.buildNumber = version;
    }
  }
}
