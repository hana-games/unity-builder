namespace UnityBuilderAction.Versioning
{
  public static class VersionGenerator
  {
    public static string Generate()
    {
      UnityEngine.Debug.Log("[SDKOPRST] 6");
      return Git.GenerateSemanticCommitVersion();
    }
  }
}
