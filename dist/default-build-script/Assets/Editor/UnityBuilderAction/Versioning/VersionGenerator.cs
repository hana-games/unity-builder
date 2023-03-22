namespace UnityBuilderAction.Versioning
{
  public static class VersionGenerator
  {
    public static string Generate()
    {
      Debug.Log("Panic Panic Panic");
      return Git.GenerateSemanticCommitVersion();
    }
  }
}
