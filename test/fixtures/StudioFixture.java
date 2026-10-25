package studio.fixture;
/** Owned fixture used only for tool verification. */
public final class StudioFixture {
    public static int add(int left,int right){return left+right+7;}
    public static void main(String[] args){System.out.println("STUDIO_JAVA_FIXTURE="+add(2,3));}
}
